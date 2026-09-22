/**
 * @vitest-environment jsdom
 * Catalog UI + IPC contract C1 [FR3.1 FR3.2 BR3.17].
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { CatalogShell } from '../src/renderer/catalog/CatalogShell';
import { RoleGate } from '../src/renderer/catalog/RoleGate';
import { ArticleForm } from '../src/renderer/catalog/ArticleForm';
import { CatalogResultList } from '../src/renderer/catalog/CatalogResultList';
import {
  catalogSearchRequestSchema,
  catalogSaveProductRequestSchema,
} from '../src/shared/catalog-ipc';
import { IPC_CHANNELS, validate } from '../src/shared/ipc-contract';
import type { TenuBridge } from '../src/shared/ipc-contract';
import { dispatchIpcRequest } from '../src/main/ipc';
import type { IpcBackend } from '../src/main/ipc';

const SESSION = {
  tenantId: '01900000-0000-7000-8000-000000000001',
  actorUserId: '01900000-0000-7000-8000-000000000002',
  deviceId: 'test-device',
  role: 'gerant' as const,
};

function catalogBridge(overrides: Partial<TenuBridge> = {}): TenuBridge {
  return {
    openDatabase: vi.fn(async () => ({
      ok: true as const,
      value: {
        path: '/tmp/x',
        encrypted: true as const,
        journalMode: 'wal',
        schemaVersion: 3,
        demoSession: null,
      },
    })),
    writeProbe: vi.fn(async () => ({
      ok: true as const,
      value: {
        id: '1',
        label: 'a',
        recordedAt: '2026-01-01T00:00:00.000Z',
        total: 1,
      },
    })),
    printProbe: vi.fn(async () => ({
      ok: true as const,
      value: {
        printed: true,
        via: 'preview' as const,
        byteCount: 1,
        reason: null,
        preview: 'x',
      },
    })),
    catalogSearch: vi.fn(async () => ({
      ok: true as const,
      value: {
        items: [
          {
            id: '01900000-0000-7000-8000-000000000010',
            internalCode: 'SKU-0001',
            name: 'Écrou',
            referencePrice: 150,
            floorPrice: 100,
            active: true,
          },
        ],
      },
    })),
    catalogGetProduct: vi.fn(async () => ({
      ok: true as const,
      value: {
        product: {
          id: '01900000-0000-7000-8000-000000000010',
          internalCode: 'SKU-0001',
          name: 'Écrou',
          barcode: null,
          altNames: [],
          categoryId: null,
          baseUnit: 'piece',
          referencePrice: 150,
          floorPrice: 100,
          stockAlertThreshold: null,
          location: null,
          active: true,
          averagePurchaseCost: 80,
        },
      },
    })),
    catalogSaveProduct: vi.fn(async () => ({
      ok: true as const,
      value: {
        productId: '01900000-0000-7000-8000-000000000010',
        internalCode: 'SKU-0001',
      },
    })),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('catalog IPC Zod [C-01]', () => {
  it('accepts a valid search request', () => {
    const parsed = validate(
      catalogSearchRequestSchema,
      { session: SESSION, query: 'ecrou', limit: 20 },
      'INVALID_REQUEST',
    );
    expect(parsed.ok).toBe(true);
  });

  it('rejects unknown fields on save (strict)', () => {
    const parsed = validate(
      catalogSaveProductRequestSchema,
      {
        session: SESSION,
        mode: 'create',
        fields: {
          designation: 'Vis',
          baseUnit: 'piece',
          referencePrice: 100,
          floorPrice: 80,
          quantity: 1,
        },
      },
      'INVALID_REQUEST',
    );
    expect(parsed.ok).toBe(false);
  });

  it('dispatches catalog.search happy path', async () => {
    const backend: IpcBackend = {
      openDatabase: vi.fn(async () => ({
        path: '/t',
        encrypted: true as const,
        journalMode: 'wal',
        schemaVersion: 3,
        demoSession: null,
      })),
      writeProbe: vi.fn(async () => ({
        id: '1',
        label: 'a',
        recordedAt: '2026-01-01T00:00:00.000Z',
        total: 1,
      })),
      printProbe: vi.fn(async () => ({
        printed: true,
        via: 'preview' as const,
        byteCount: 1,
        reason: null,
        preview: 'x',
      })),
      catalogSearch: vi.fn(async () => ({
        items: [
          {
            id: '01900000-0000-7000-8000-000000000010',
            internalCode: 'SKU-1',
            name: 'Vis',
            referencePrice: 10,
            floorPrice: 5,
            active: true,
          },
        ],
      })),
      catalogGetProduct: vi.fn(async () => ({ product: null })),
      catalogSaveProduct: vi.fn(async () => ({
        productId: '01900000-0000-7000-8000-000000000010',
        internalCode: 'SKU-1',
      })),
    };
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.catalogSearch,
      { session: SESSION, query: 'vis', limit: 10 },
      backend,
    );
    expect(result.ok).toBe(true);
  });
});

describe('RoleGate / ArticleForm [BR3.17]', () => {
  it('hides purchase cost for vendeur', () => {
    render(
      <ArticleForm
        role="vendeur"
        mode="view"
        values={{
          designation: 'Scie',
          baseUnit: 'piece',
          referencePrice: '5000',
          floorPrice: '4000',
          averagePurchaseCost: '3000',
        }}
        fieldError={null}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.queryByTestId('article-purchase-cost')).toBeNull();
    expect(screen.queryByTestId('article-save')).toBeNull();
  });

  it('shows purchase cost for gerant', () => {
    render(
      <RoleGate role="gerant" allow={['gerant', 'proprietaire']}>
        <span data-testid="gated">ok</span>
      </RoleGate>,
    );
    expect(screen.getByTestId('gated')).toBeTruthy();
    expect(
      render(
        <RoleGate role="vendeur" allow={['gerant']}>
          <span data-testid="hidden">no</span>
        </RoleGate>,
      ).container.textContent,
    ).toBe('');
  });

  it('shows loading results', () => {
    render(
      <CatalogResultList
        items={[]}
        selectedId={null}
        onSelect={() => undefined}
        empty={false}
        loading
      />,
    );
    expect(screen.getByTestId('catalog-results-loading')).toBeTruthy();
  });
});

describe('CatalogShell search + save [FR3.1 FR3.2]', () => {
  it('searches and opens a product', async () => {
    const bridge = catalogBridge();
    render(<CatalogShell bridge={bridge} session={SESSION} />);
    fireEvent.change(screen.getByTestId('catalog-search-input'), {
      target: { value: 'ecrou' },
    });
    await waitFor(() => {
      expect(bridge.catalogSearch).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-result-list')).toBeTruthy();
    });
    fireEvent.click(
      screen.getByTestId('catalog-result-01900000-0000-7000-8000-000000000010'),
    );
    await waitFor(() => {
      expect(bridge.catalogGetProduct).toHaveBeenCalled();
    });
    expect(screen.getByTestId('article-designation')).toHaveProperty('value', 'Écrou');
  });

  it('handles getProduct failure and missing product', async () => {
    const missing = catalogBridge({
      catalogGetProduct: vi.fn(async () => ({ ok: true as const, value: { product: null } })),
    });
    const { unmount } = render(<CatalogShell bridge={missing} session={SESSION} />);
    fireEvent.change(screen.getByTestId('catalog-search-input'), {
      target: { value: 'ecrou' },
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-result-list')).toBeTruthy();
    });
    fireEvent.click(
      screen.getByTestId('catalog-result-01900000-0000-7000-8000-000000000010'),
    );
    await waitFor(() => {
      expect(screen.getByTestId('catalog-status').textContent).toMatch(/introuvable/i);
    });
    unmount();

    const failing = catalogBridge({
      catalogGetProduct: vi.fn(async () => ({
        ok: false as const,
        code: 'DATABASE_FAILED' as const,
        message: 'nope',
      })),
    });
    render(<CatalogShell bridge={failing} session={SESSION} />);
    fireEvent.change(screen.getByTestId('catalog-search-input'), {
      target: { value: 'ecrou' },
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-result-list')).toBeTruthy();
    });
    fireEvent.click(
      screen.getByTestId('catalog-result-01900000-0000-7000-8000-000000000010'),
    );
    await waitFor(() => {
      expect(screen.getByTestId('catalog-status').textContent).toMatch(/DATABASE_FAILED/);
    });
  });

  it('shows IPC error on save failure', async () => {
    const bridge = catalogBridge({
      catalogSaveProduct: vi.fn(async () => ({
        ok: false as const,
        code: 'VALIDATION_FAILED' as const,
        message: 'FLOOR_ABOVE_REFERENCE',
      })),
    });
    render(<CatalogShell bridge={bridge} session={SESSION} />);
    fireEvent.click(screen.getByTestId('catalog-new-article'));
    fireEvent.change(screen.getByTestId('article-designation'), {
      target: { value: 'Vis' },
    });
    fireEvent.change(screen.getByTestId('article-reference-price'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByTestId('article-floor-price'), {
      target: { value: '200' },
    });
    fireEvent.click(screen.getByTestId('article-save'));
    await waitFor(() => {
      expect(screen.getByTestId('article-field-error').textContent).toMatch(/VALIDATION_FAILED/);
    });
  });

  it('rejects non-integer money in the form', async () => {
    const bridge = catalogBridge();
    render(<CatalogShell bridge={bridge} session={SESSION} />);
    fireEvent.click(screen.getByTestId('catalog-new-article'));
    fireEvent.change(screen.getByTestId('article-designation'), {
      target: { value: 'Vis' },
    });
    fireEvent.change(screen.getByTestId('article-reference-price'), {
      target: { value: '10.5' },
    });
    fireEvent.change(screen.getByTestId('article-floor-price'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('article-save'));
    await waitFor(() => {
      expect(screen.getByTestId('article-field-error').textContent).toMatch(/entiers/);
    });
    expect(bridge.catalogSaveProduct).not.toHaveBeenCalled();
  });

  it('shows empty results and search IPC errors', async () => {
    const bridge = catalogBridge({
      catalogSearch: vi.fn(async () => ({ ok: true as const, value: { items: [] } })),
    });
    const { unmount } = render(<CatalogShell bridge={bridge} session={SESSION} />);
    fireEvent.change(screen.getByTestId('catalog-search-input'), {
      target: { value: 'zzzz' },
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-results-empty')).toBeTruthy();
    });
    unmount();

    const failing = catalogBridge({
      catalogSearch: vi.fn(async () => ({
        ok: false as const,
        code: 'DATABASE_FAILED' as const,
        message: 'boom',
      })),
    });
    render(<CatalogShell bridge={failing} session={{ ...SESSION, role: 'vendeur' }} />);
    fireEvent.change(screen.getByTestId('catalog-search-input'), {
      target: { value: 'vis' },
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-status').textContent).toMatch(/DATABASE_FAILED/);
    });
  });

  it('saves a new article happily', async () => {
    const bridge = catalogBridge();
    render(<CatalogShell bridge={bridge} session={SESSION} />);
    fireEvent.click(screen.getByTestId('catalog-new-article'));
    fireEvent.change(screen.getByTestId('article-designation'), {
      target: { value: 'Marteau' },
    });
    fireEvent.change(screen.getByTestId('article-reference-price'), {
      target: { value: '2500' },
    });
    fireEvent.change(screen.getByTestId('article-floor-price'), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByTestId('article-purchase-cost'), {
      target: { value: '1500' },
    });
    fireEvent.click(screen.getByTestId('article-save'));
    await waitFor(() => {
      expect(bridge.catalogSaveProduct).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('catalog-status').textContent).toMatch(/enregistré/i);
    });
  });
});

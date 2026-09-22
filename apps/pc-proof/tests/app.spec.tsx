/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { App } from '../src/renderer/App';
import type { TenuBridge } from '../src/shared/ipc-contract';

function mockBridge(overrides: Partial<TenuBridge> = {}): TenuBridge {
  return {
    openDatabase: vi.fn(async () => ({
      ok: true as const,
      value: {
        path: '/tmp/probe.db',
        encrypted: true as const,
        journalMode: 'wal',
        schemaVersion: 3,
        demoSession: null,
      },
    })),
    writeProbe: vi.fn(async () => ({
      ok: true as const,
      value: {
        id: '01900000-0000-7000-8000-000000000001',
        label: 'essai',
        recordedAt: '2026-03-15T10:30:00.000Z',
        total: 1,
      },
    })),
    printProbe: vi.fn(async () => ({
      ok: true as const,
      value: {
        printed: true,
        via: 'preview' as const,
        byteCount: 42,
        reason: null,
        preview: "TICKET D'ESSAI\n12 500 FCFA",
      },
    })),
    catalogSearch: vi.fn(async () => ({ ok: true as const, value: { items: [] } })),
    catalogGetProduct: vi.fn(async () => ({ ok: true as const, value: { product: null } })),
    catalogSaveProduct: vi.fn(async () => ({
      ok: true as const,
      value: { productId: '01900000-0000-7000-8000-000000000010', internalCode: 'SKU-0001' },
    })),
    ...overrides,
  };
}

describe('App renderer [NFR8]', () => {
  beforeEach(() => {
    window.tenu = mockBridge();
  });

  afterEach(() => {
    cleanup();
  });

  it('ouvre la base, écrit et imprime', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('open-database'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toMatch(/Base ouverte/);
    });
    expect(screen.getByTestId('database-info')).toBeTruthy();

    fireEvent.click(screen.getByTestId('write-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toMatch(/Ligne écrite/);
    });

    fireEvent.click(screen.getByTestId('print-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('print-preview').textContent).toContain("TICKET D'ESSAI");
    });
  });

  it('affiche une erreur IPC typée', async () => {
    window.tenu = mockBridge({
      openDatabase: vi.fn(async () => ({
        ok: false as const,
        code: 'DATABASE_UNAVAILABLE' as const,
        message: 'indisponible',
      })),
    });
    render(<App />);
    fireEvent.click(screen.getByTestId('open-database'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toContain('DATABASE_UNAVAILABLE');
    });
  });

  it('signale une impression non effectuée sans bloquer', async () => {
    window.tenu = mockBridge({
      printProbe: vi.fn(async () => ({
        ok: true as const,
        value: {
          printed: false,
          via: 'usb' as const,
          byteCount: 10,
          reason: 'papier manquant',
          preview: 'x',
        },
      })),
    });
    render(<App />);
    fireEvent.click(screen.getByTestId('print-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toMatch(/papier manquant/);
    });
    expect((screen.getByTestId('open-database') as HTMLButtonElement).disabled).toBe(false);
  });

  it('signale une erreur d’écriture et d’impression IPC', async () => {
    window.tenu = mockBridge({
      openDatabase: vi.fn(async () => ({
        ok: true as const,
        value: {
          path: '/tmp/probe.db',
          encrypted: true as const,
          journalMode: 'wal',
          schemaVersion: 3,
          demoSession: null,
        },
      })),
      writeProbe: vi.fn(async () => ({
        ok: false as const,
        code: 'DATABASE_FAILED' as const,
        message: 'ecriture refusee',
      })),
      printProbe: vi.fn(async () => ({
        ok: false as const,
        code: 'PRINT_FAILED' as const,
        message: 'imprimante morte',
      })),
    });
    render(<App />);
    fireEvent.click(screen.getByTestId('open-database'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toMatch(/Base ouverte/);
    });
    fireEvent.click(screen.getByTestId('write-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toContain('DATABASE_FAILED');
    });
    fireEvent.click(screen.getByTestId('print-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toContain('PRINT_FAILED');
    });
  });

  it('ouvre le catalogue avec session démo et change de rôle', async () => {
    window.tenu = mockBridge({
      openDatabase: vi.fn(async () => ({
        ok: true as const,
        value: {
          path: '/tmp/probe.db',
          encrypted: true as const,
          journalMode: 'wal',
          schemaVersion: 3,
          demoSession: {
            tenantId: '01900000-0000-7000-8000-000000000001',
            proprietaireId: '01900000-0000-7000-8000-000000000002',
            gerantId: '01900000-0000-7000-8000-000000000003',
            vendeurId: '01900000-0000-7000-8000-000000000004',
          },
        },
      })),
    });
    render(<App />);
    fireEvent.click(screen.getByTestId('open-database'));
    await waitFor(() => {
      expect(screen.getByTestId('status-line').textContent).toMatch(/Base ouverte/);
    });
    fireEvent.click(screen.getByTestId('tab-catalogue'));
    expect(screen.getByTestId('catalog-shell')).toBeTruthy();
    fireEvent.change(screen.getByTestId('catalog-role-select'), {
      target: { value: 'vendeur' },
    });
    expect((screen.getByTestId('catalog-role-select') as HTMLSelectElement).value).toBe('vendeur');
  });
});

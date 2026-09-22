/**
 * Tests du pont côté préchargement (étape 7).
 */
import { describe, expect, it, vi } from 'vitest';
import { createTenuBridge, invokeValidated } from '../src/preload/bridge';
import {
  IPC_CHANNELS,
  MAX_PAYLOAD_BYTES,
  openDatabaseRequestSchema,
  openDatabaseResponseSchema,
  writeProbeRequestSchema,
  writeProbeResponseSchema,
} from '../src/shared/ipc-contract';

describe('preload bridge [NFR8]', () => {
  it('valide la requête et la réponse au cas nominal', async () => {
    const invoke = vi.fn(async () => ({
      ok: true,
      value: {
        path: '/tmp/db',
        encrypted: true,
        journalMode: 'wal',
        schemaVersion: 1,
        demoSession: null,
      },
    }));
    const result = await invokeValidated(
      invoke,
      IPC_CHANNELS.openDatabase,
      {},
      openDatabaseRequestSchema,
      openDatabaseResponseSchema,
    );
    expect(result.ok).toBe(true);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.openDatabase, {});
  });

  it('rejette une charge trop grande', async () => {
    const result = await invokeValidated(
      async () => ({ ok: true, value: {} }),
      IPC_CHANNELS.writeProbe,
      { label: 'x'.repeat(MAX_PAYLOAD_BYTES) },
      writeProbeRequestSchema,
      writeProbeResponseSchema,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejette une requête invalide', async () => {
    const result = await invokeValidated(
      async () => ({ ok: true, value: {} }),
      IPC_CHANNELS.writeProbe,
      { label: '' },
      writeProbeRequestSchema,
      writeProbeResponseSchema,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_REQUEST');
  });

  it('rejette une réponse non structurée', async () => {
    const result = await invokeValidated(
      async () => 'nope',
      IPC_CHANNELS.openDatabase,
      {},
      openDatabaseRequestSchema,
      openDatabaseResponseSchema,
    );
    expect(result).toMatchObject({ ok: false, code: 'INVALID_RESPONSE' });
  });

  it('propage un Failure du processus principal', async () => {
    const result = await invokeValidated(
      async () => ({ ok: false, code: 'DATABASE_FAILED', message: 'x' }),
      IPC_CHANNELS.openDatabase,
      {},
      openDatabaseRequestSchema,
      openDatabaseResponseSchema,
    );
    expect(result).toEqual({ ok: false, code: 'DATABASE_FAILED', message: 'x' });
  });

  it('createTenuBridge expose les trois canaux', async () => {
    const invoke = vi.fn(async (channel: string) => {
      if (channel === IPC_CHANNELS.openDatabase) {
        return {
          ok: true,
          value: {
            path: '/p',
            encrypted: true,
            journalMode: 'wal',
            schemaVersion: 1,
            demoSession: null,
          },
        };
      }
      if (channel === IPC_CHANNELS.writeProbe) {
        return {
          ok: true,
          value: {
            id: '1',
            label: 'a',
            recordedAt: '2026-01-01T00:00:00.000Z',
            total: 1,
          },
        };
      }
      return {
        ok: true,
        value: {
          printed: true,
          via: 'preview',
          byteCount: 1,
          reason: null,
          preview: 'x',
        },
      };
    });
    const bridge = createTenuBridge(invoke);
    await expect(bridge.openDatabase({})).resolves.toMatchObject({ ok: true });
    await expect(bridge.writeProbe({ label: 'a' })).resolves.toMatchObject({ ok: true });
    await expect(
      bridge.printProbe({ target: 'preview', label: 'a', amountFcfa: 1 }),
    ).resolves.toMatchObject({ ok: true });
  });

  it('expose les canaux catalogue', async () => {
    const invoke = vi.fn(async (channel: string) => {
      if (channel === IPC_CHANNELS.catalogSearch) {
        return { ok: true, value: { items: [] } };
      }
      if (channel === IPC_CHANNELS.catalogGetProduct) {
        return { ok: true, value: { product: null } };
      }
      return {
        ok: true,
        value: {
          productId: '01900000-0000-7000-8000-000000000010',
          internalCode: 'SKU-1',
        },
      };
    });
    const bridge = createTenuBridge(invoke);
    const session = {
      tenantId: 't',
      actorUserId: 'u',
      deviceId: 'd',
      role: 'gerant' as const,
    };
    await expect(
      bridge.catalogSearch({ session, query: 'x', limit: 5 }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      bridge.catalogGetProduct({ session, productId: '01900000-0000-7000-8000-000000000010' }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      bridge.catalogSaveProduct({
        session,
        mode: 'create',
        fields: {
          designation: 'Vis',
          baseUnit: 'piece',
          referencePrice: 10,
          floorPrice: 5,
        },
      }),
    ).resolves.toMatchObject({ ok: true });
  });
});

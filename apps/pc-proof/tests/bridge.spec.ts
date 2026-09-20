/**
 * Tests du pont IPC (étape 7, NFR8).
 */
import { describe, expect, it, vi } from 'vitest';
import { dispatchIpcRequest, IpcBackendError, registerIpcHandlers } from '../src/main/ipc';
import type { IpcBackend } from '../src/main/ipc';
import { IPC_CHANNELS, MAX_PAYLOAD_BYTES } from '../src/shared/ipc-contract';

function createBackend(overrides: Partial<IpcBackend> = {}): IpcBackend {
  return {
    openDatabase: vi.fn(async () => ({
      path: '/tmp/probe.db',
      encrypted: true as const,
      journalMode: 'wal',
      schemaVersion: 1,
    })),
    writeProbe: vi.fn(async () => ({
      id: '01900000-0000-7000-8000-000000000001',
      label: 'ok',
      recordedAt: '2026-01-01T00:00:00.000Z',
      total: 1,
    })),
    printProbe: vi.fn(async () => ({
      printed: true,
      via: 'preview' as const,
      byteCount: 128,
      reason: null,
      preview: 'TICKET',
    })),
    ...overrides,
  };
}

describe('dispatchIpcRequest — cas nominaux [NFR8]', () => {
  it('ouvre la base via le canal déclaré', async () => {
    const backend = createBackend();
    const result = await dispatchIpcRequest(IPC_CHANNELS.openDatabase, {}, backend);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({ encrypted: true, journalMode: 'wal' });
    }
    expect(backend.openDatabase).toHaveBeenCalledOnce();
  });

  it('écrit une ligne d’essai', async () => {
    const backend = createBackend();
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.writeProbe,
      { label: 'ligne-1' },
      backend,
    );
    expect(result.ok).toBe(true);
    expect(backend.writeProbe).toHaveBeenCalledWith({ label: 'ligne-1' });
  });

  it('imprime un ticket d’essai', async () => {
    const backend = createBackend();
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.printProbe,
      { target: 'preview', label: 'demo', amountFcfa: 12500 },
      backend,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({ printed: true, via: 'preview' });
    }
  });
});

describe('dispatchIpcRequest — rejets [NFR8]', () => {
  it('rejette un canal inconnu', async () => {
    const result = await dispatchIpcRequest('tenu:unknown', {}, createBackend());
    expect(result).toEqual({
      ok: false,
      code: 'UNKNOWN_CHANNEL',
      message: 'Canal inconnu : tenu:unknown',
    });
  });

  it('rejette une charge trop grande sans l’analyser', async () => {
    const huge = { label: 'x'.repeat(MAX_PAYLOAD_BYTES) };
    const result = await dispatchIpcRequest(IPC_CHANNELS.writeProbe, huge, createBackend());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejette une requête Zod invalide', async () => {
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.writeProbe,
      { label: '' },
      createBackend(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_REQUEST');
  });

  it('rejette une réponse non conforme produite par le backend', async () => {
    const backend = createBackend({
      openDatabase: vi.fn(async () => ({ broken: true }) as never),
    });
    const result = await dispatchIpcRequest(IPC_CHANNELS.openDatabase, {}, backend);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_RESPONSE');
  });

  it('convertit une IpcBackendError en Failure typé, jamais en exception', async () => {
    const backend = createBackend({
      writeProbe: vi.fn(async () => {
        throw new IpcBackendError('DATABASE_UNAVAILABLE', 'base fermée');
      }),
    });
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.writeProbe,
      { label: 'x' },
      backend,
    );
    expect(result).toEqual({
      ok: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'base fermée',
    });
  });

  it('convertit une exception inattendue en INTERNAL_ERROR', async () => {
    const backend = createBackend({
      writeProbe: vi.fn(async () => {
        throw new Error('boom');
      }),
    });
    const result = await dispatchIpcRequest(
      IPC_CHANNELS.writeProbe,
      { label: 'x' },
      backend,
    );
    expect(result).toEqual({ ok: false, code: 'INTERNAL_ERROR', message: 'boom' });
  });
});

describe('registerIpcHandlers', () => {
  it('enregistre les trois canaux et remplace les handlers existants', () => {
    const removed: string[] = [];
    const handled: string[] = [];
    registerIpcHandlers(
      {
        removeHandler(channel) {
          removed.push(channel);
        },
        handle(channel, _listener) {
          handled.push(channel);
        },
      },
      createBackend(),
    );
    expect(removed).toEqual(Object.values(IPC_CHANNELS));
    expect(handled).toEqual(Object.values(IPC_CHANNELS));
  });
});

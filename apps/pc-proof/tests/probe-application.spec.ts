/**
 * Couverture du service ProbeApplication et de la clé de chiffrement.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ProbeApplication } from '../src/main/probe-application';
import {
  InvalidEncryptionKeyError,
  UnencryptedDatabaseError,
} from '../src/main/database/database';
import {
  DEVELOPMENT_FALLBACK_KEY,
  ENCRYPTION_KEY_ENV_VAR,
  ENVIRONMENT_ENV_VAR,
  MissingEncryptionKeyError,
  describeEncryptionKey,
  resolveEncryptionKey,
} from '../src/main/database/encryption-key';
import { PreviewReceiptPrinter } from '../src/main/printing/preview-printer';
import { PrinterError, type ReceiptPrinter } from '../src/main/printing/receipt-printer';
import {
  composeUuidV7,
  createUuidV7Generator,
  isUuidV7,
} from '../src/main/database/uuid-v7';

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
});

function dbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tenu-probe-'));
  dirs.push(dir);
  return join(dir, 'probe.db');
}

describe('resolveEncryptionKey [NFR8]', () => {
  it('lit la variable d’environnement', () => {
    const resolved = resolveEncryptionKey({ [ENCRYPTION_KEY_ENV_VAR]: 'from-env' });
    expect(resolved).toEqual({ key: 'from-env', source: 'environment' });
    expect(describeEncryptionKey(resolved)).toContain(ENCRYPTION_KEY_ENV_VAR);
  });

  it('utilise le repli de développement hors production', () => {
    const resolved = resolveEncryptionKey({});
    expect(resolved.key).toBe(DEVELOPMENT_FALLBACK_KEY);
    expect(resolved.source).toBe('development-fallback');
  });

  it('refuse l’absence de clé en production', () => {
    expect(() =>
      resolveEncryptionKey({ [ENVIRONMENT_ENV_VAR]: 'production' }),
    ).toThrow(MissingEncryptionKeyError);
  });
});

describe('uuid v7', () => {
  it('compose un identifiant conforme et croît dans la même milliseconde', () => {
    const first = composeUuidV7(1_700_000_000_000, 0, new Uint8Array(8).fill(1));
    const second = composeUuidV7(1_700_000_000_000, 1, new Uint8Array(8).fill(1));
    expect(isUuidV7(first)).toBe(true);
    expect(first < second).toBe(true);
  });

  it('le générateur avance l’horloge si le compteur sature', () => {
    let now = 1000;
    const gen = createUuidV7Generator({
      now: () => now,
      randomBytes: (size) => new Uint8Array(size),
    });
    for (let i = 0; i <= 0x0fff; i += 1) gen.next();
    const overflow = gen.next();
    expect(isUuidV7(overflow)).toBe(true);
    now = 2000;
    expect(isUuidV7(gen.next())).toBe(true);
  });

  it('rejette des entrées hors plage', () => {
    expect(() => composeUuidV7(-1, 0, new Uint8Array(8))).toThrow(RangeError);
    expect(() => composeUuidV7(1, 99_999, new Uint8Array(8))).toThrow(RangeError);
    expect(() => composeUuidV7(1, 0, new Uint8Array(3))).toThrow(RangeError);
  });
});

describe('ProbeApplication', () => {
  it('ouvre, écrit et imprime via preview', async () => {
    const preview = new PreviewReceiptPrinter();
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      now: () => Date.parse('2026-03-15T10:30:00.000Z'),
      createPrinter: () => preview,
    });

    const opened = await app.openDatabase();
    expect(opened.encrypted).toBe(true);

    const written = await app.writeProbe({ label: 'probe-1' });
    expect(written.total).toBe(1);

    const printed = await app.printProbe({
      target: 'preview',
      label: 'probe-1',
      amountFcfa: 12_500,
    });
    expect(printed.printed).toBe(true);
    expect(printed.preview).toContain("TICKET D'ESSAI");
    app.close();
  });

  it('refuse d’écrire si la base n’est pas ouverte', async () => {
    const app = new ProbeApplication({ databasePath: dbPath() });
    try {
      await app.writeProbe({ label: 'x' });
      expect.unreachable('writeProbe aurait dû lever');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({ code: 'DATABASE_UNAVAILABLE' });
    }
  });

  it('un échec d’impression reste ok:true avec printed:false', async () => {
    const failing: ReceiptPrinter = {
      target: 'usb',
      description: 'fail',
      isAvailable: async () => true,
      print: async () => {
        throw new PrinterError('PRINTER_REFUSED', 'no paper');
      },
    };
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      createPrinter: () => failing,
    });
    await app.openDatabase();
    const written = await app.writeProbe({ label: 'avant-print' });
    const printed = await app.printProbe({
      target: 'usb',
      label: written.label,
      amountFcfa: 100,
    });
    expect(printed.printed).toBe(false);
    expect(printed.reason).toContain('no paper');
    expect(app.database?.countProbeEntries()).toBe(1);
    app.close();
  });

  it('mappe une base illisible en DATABASE_UNAVAILABLE', async () => {
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      openDatabase: () => {
        throw new UnencryptedDatabaseError('/tmp/plain.db');
      },
    });
    try {
      await app.openDatabase();
      expect.unreachable('aurait dû lever');
    } catch (error) {
      expect(error).toMatchObject({ code: 'DATABASE_UNAVAILABLE' });
    }
  });

  it('mappe une clé invalide en DATABASE_UNAVAILABLE', async () => {
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      openDatabase: () => {
        throw new InvalidEncryptionKeyError('/tmp/x.db');
      },
    });
    await expect(app.openDatabase()).rejects.toMatchObject({ code: 'DATABASE_UNAVAILABLE' });
  });

  it('mappe une erreur générique d’ouverture en DATABASE_FAILED', async () => {
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      openDatabase: () => {
        throw new Error('disk vanished');
      },
    });
    await expect(app.openDatabase()).rejects.toMatchObject({ code: 'DATABASE_FAILED' });
  });

  it('mappe une erreur d’écriture en DATABASE_FAILED', async () => {
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
      openDatabase: () =>
        ({
          isClosed: false,
          filePath: '/tmp/x.db',
          journalMode: 'wal',
          schemaVersion: 1,
          insertProbeEntry: () => {
            throw new Error('disk full');
          },
          countProbeEntries: () => 0,
          close: () => undefined,
        }) as never,
    });
    await app.openDatabase();
    try {
      await app.writeProbe({ label: 'x' });
      expect.unreachable('aurait dû lever');
    } catch (error) {
      expect(error).toMatchObject({ code: 'DATABASE_FAILED' });
    }
  });
});

describe('ProbeApplication catalog C1 [FR3.1 FR3.2 BR3.17]', () => {
  it('seeds demo session and searches accented product', async () => {
    const app = new ProbeApplication({
      databasePath: dbPath(),
      env: { [ENCRYPTION_KEY_ENV_VAR]: DEVELOPMENT_FALLBACK_KEY },
    });
    const opened = await app.openDatabase();
    expect(opened.demoSession).not.toBeNull();
    const session = opened.demoSession;
    if (session === null) throw new Error('demoSession required');

    const search = await app.catalogSearch({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.gerantId,
        deviceId: 'test',
        role: 'gerant',
      },
      query: 'ecrou',
      limit: 10,
    });
    expect(search.items.length).toBeGreaterThan(0);
    expect(search.items[0]?.name.toLowerCase()).toContain('écrou');

    const product = await app.catalogGetProduct({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.vendeurId,
        deviceId: 'test',
        role: 'vendeur',
      },
      productId: search.items[0]?.id ?? '',
    });
    expect(product.product).not.toBeNull();
    expect(product.product && 'averagePurchaseCost' in product.product).toBe(false);

    const saved = await app.catalogSaveProduct({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.gerantId,
        deviceId: 'test',
        role: 'gerant',
      },
      mode: 'create',
      fields: {
        designation: 'Pince coupante',
        baseUnit: 'piece',
        referencePrice: 3500,
        floorPrice: 3000,
      },
    });
    expect(saved.internalCode).toMatch(/^SKU-/);

    await expect(
      app.catalogSaveProduct({
        session: {
          tenantId: session.tenantId,
          actorUserId: session.vendeurId,
          deviceId: 'test',
          role: 'vendeur',
        },
        mode: 'create',
        fields: {
          designation: 'Interdit',
          baseUnit: 'piece',
          referencePrice: 10,
          floorPrice: 5,
        },
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_ROLE' });

    await expect(
      app.catalogSaveProduct({
        session: {
          tenantId: session.tenantId,
          actorUserId: session.gerantId,
          deviceId: 'test',
          role: 'gerant',
        },
        mode: 'create',
        fields: {
          designation: 'Bad',
          baseUnit: 'piece',
          referencePrice: 10,
          floorPrice: 50,
        },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    await expect(
      app.catalogGetProduct({
        session: {
          tenantId: session.tenantId,
          actorUserId: session.gerantId,
          deviceId: 'test',
          role: 'gerant',
        },
        productId: '01900000-0000-7000-8000-000000000099',
      }),
    ).resolves.toEqual({ product: null });

    const asOwner = await app.catalogGetProduct({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.proprietaireId,
        deviceId: 'test',
        role: 'proprietaire',
      },
      productId: search.items[0]?.id ?? '',
    });
    expect(asOwner.product && 'averagePurchaseCost' in asOwner.product).toBe(true);

    const reopened = await app.openDatabase();
    expect(reopened.demoSession?.tenantId).toBe(session.tenantId);

    app.close();
    await expect(
      app.catalogSearch({
        session: {
          tenantId: session.tenantId,
          actorUserId: session.gerantId,
          deviceId: 'test',
          role: 'gerant',
        },
        query: 'x',
        limit: 5,
      }),
    ).rejects.toMatchObject({ code: 'DATABASE_UNAVAILABLE' });
  });
});

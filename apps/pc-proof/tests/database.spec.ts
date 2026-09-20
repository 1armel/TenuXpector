/**
 * Tests de la base chiffrée (étape 11, NFR4 / NFR8 / NFR17).
 * Fichier réel sur disque — jamais une base en mémoire.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3-multiple-ciphers';
import {
  EncryptedDatabase,
  InvalidEncryptionKeyError,
  UnencryptedDatabaseError,
  openEncryptedDatabase,
} from '../src/main/database/database';
import { DEVELOPMENT_FALLBACK_KEY } from '../src/main/database/encryption-key';
import { isUuidV7, timestampOfUuidV7 } from '../src/main/database/uuid-v7';

const tempDirs: string[] = [];

function tempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tenu-db-'));
  tempDirs.push(dir);
  return join(dir, 'probe.db');
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
});

describe('EncryptedDatabase.open [NFR8]', () => {
  it('ouvre une base neuve chiffrée en WAL / FULL', () => {
    const path = tempDbPath();
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
      now: () => 1_700_000_000_000,
    });
    expect(db.journalMode.toLowerCase()).toBe('wal');
    expect(db.synchronousMode).toBe(2); // FULL
    expect(db.schemaVersion).toBe(2);
    db.close();
  });

  it('refuse une mauvaise clé', () => {
    const path = tempDbPath();
    const first = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    first.insertProbeEntry('seed');
    first.close();

    expect(() =>
      openEncryptedDatabase({ filePath: path, encryptionKey: 'mauvaise-cle' }),
    ).toThrow(InvalidEncryptionKeyError);
  });

  it('refuse une base SQLite non chiffrée', () => {
    const path = tempDbPath();
    const plain = new Database(path);
    plain.exec('CREATE TABLE t(id INTEGER);');
    plain.close();

    expect(() =>
      openEncryptedDatabase({ filePath: path, encryptionKey: DEVELOPMENT_FALLBACK_KEY }),
    ).toThrow(UnencryptedDatabaseError);
  });
});

describe('EncryptedDatabase lecture / écriture [NFR4]', () => {
  it('écrit et relit une ligne d’essai', () => {
    const path = tempDbPath();
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
      now: () => 1_700_000_000_123,
    });
    const entry = db.insertProbeEntry('premiere');
    expect(isUuidV7(entry.id)).toBe(true);
    expect(entry.label).toBe('premiere');
    expect(db.listProbeEntries()).toHaveLength(1);
    expect(db.countProbeEntries()).toBe(1);
    db.close();

    const reopened = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(reopened.listProbeEntries()[0]?.label).toBe('premiere');
    reopened.close();
  });

  it('annule une transaction en cas d’exception', () => {
    const path = tempDbPath();
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(() =>
      db.transaction(() => {
        db.insertProbeEntry('a');
        throw new Error('abort');
      }),
    ).toThrow('abort');
    expect(db.countProbeEntries()).toBe(0);
    db.close();
  });

  it('génère des UUID v7 croissants', () => {
    const path = tempDbPath();
    let tick = 1_700_000_000_000;
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
      now: () => tick,
      randomBytes: (size) => new Uint8Array(size).fill(7),
    });
    const first = db.insertProbeEntry('a');
    tick += 1;
    const second = db.insertProbeEntry('b');
    expect(timestampOfUuidV7(first.id)).toBeLessThan(timestampOfUuidV7(second.id));
    expect(first.id < second.id).toBe(true);
    db.close();
  });
});

describe('migrations aller / retour', () => {
  it('redescend puis remonte le schéma', () => {
    const path = tempDbPath();
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    db.insertProbeEntry('keep');
    expect(db.schemaVersion).toBe(2);
    expect(db.migrateDown(0)).toBe(2);
    expect(db.schemaVersion).toBe(0);
    expect(() => db.countProbeEntries()).toThrow();
    expect(db.migrateUp()).toBe(2);
    expect(db.schemaVersion).toBe(2);
    expect(db.countProbeEntries()).toBe(0);
    db.close();
  });
});

describe('intégrité après fermeture', () => {
  it('passe integrity_check après fermeture / réouverture', () => {
    const path = tempDbPath();
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    db.insertProbeBatch('batch', 5);
    db.assertIntegrity();
    db.close();

    const again = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(again.integrityCheck()).toBe('ok');
    expect(again.countProbeEntries()).toBe(5);
    again.close();
  });

  it('accepte un fichier vide comme base neuve', () => {
    const path = tempDbPath();
    writeFileSync(path, '');
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(db).toBeInstanceOf(EncryptedDatabase);
    db.close();
  });
});

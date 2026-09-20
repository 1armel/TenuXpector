/**
 * Encryption key resolution and EncryptedDatabase durability basics [NFR8].
 */
import { writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3-multiple-ciphers';
import {
  DEVELOPMENT_FALLBACK_KEY,
  EncryptedDatabase,
  InvalidEncryptionKeyError,
  MissingEncryptionKeyError,
  UnencryptedDatabaseError,
  describeEncryptionKey,
  isProductionEnvironment,
  openEncryptedDatabase,
  resolveEncryptionKey,
} from '../src/index';
import { cleanupTempDirs, tempDbPath } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('resolveEncryptionKey [NFR8]', () => {
  it('reads the environment variable when set', () => {
    const resolved = resolveEncryptionKey({ TENU_DATABASE_KEY: 'from-env' });
    expect(resolved.source).toBe('environment');
    expect(resolved.key).toBe('from-env');
    expect(describeEncryptionKey(resolved)).toContain('TENU_DATABASE_KEY');
  });

  it('falls back in non-production', () => {
    const resolved = resolveEncryptionKey({});
    expect(resolved.source).toBe('development-fallback');
    expect(resolved.key).toBe(DEVELOPMENT_FALLBACK_KEY);
    expect(describeEncryptionKey(resolved)).toContain('development');
  });

  it('throws in production without a key', () => {
    expect(() => resolveEncryptionKey({ TENU_ENV: 'production' })).toThrow(
      MissingEncryptionKeyError,
    );
  });

  it('detects production via TENU_ENV', () => {
    expect(isProductionEnvironment({ TENU_ENV: 'production' })).toBe(true);
    expect(isProductionEnvironment({})).toBe(false);
  });
});

describe('EncryptedDatabase open guards [NFR8]', () => {
  it('opens a new encrypted database in WAL / FULL', () => {
    const db = openEncryptedDatabase({
      filePath: tempDbPath(),
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(db.journalMode.toLowerCase()).toBe('wal');
    expect(db.synchronousMode).toBe(2);
    expect(db.isClosed).toBe(false);
    db.close();
    expect(db.isClosed).toBe(true);
  });

  it('refuses a wrong key', () => {
    const path = tempDbPath('wrong-key.db');
    const first = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    first.insertProbeEntry('seed');
    first.close();
    expect(() =>
      openEncryptedDatabase({ filePath: path, encryptionKey: 'bad-key' }),
    ).toThrow(InvalidEncryptionKeyError);
  });

  it('refuses plaintext SQLite', () => {
    const path = tempDbPath('plain.db');
    const plain = new Database(path);
    plain.exec('CREATE TABLE t(id INTEGER);');
    plain.close();
    expect(() =>
      openEncryptedDatabase({ filePath: path, encryptionKey: DEVELOPMENT_FALLBACK_KEY }),
    ).toThrow(UnencryptedDatabaseError);
  });

  it('accepts an empty file as a new database', () => {
    const path = tempDbPath('empty.db');
    writeFileSync(path, '');
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(db).toBeInstanceOf(EncryptedDatabase);
    db.assertIntegrity();
    expect(db.integrityCheck()).toBe('ok');
    db.close();
  });

  it('rolls back on transaction exception', () => {
    const db = openEncryptedDatabase({
      filePath: tempDbPath(),
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

  it('lists probe entries after reopen', () => {
    const path = tempDbPath('reopen.db');
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
      now: () => 1_700_000_000_000,
    });
    db.insertProbeBatch('b', 3);
    expect(db.listProbeEntries()).toHaveLength(3);
    db.close();
    const again = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(again.countProbeEntries()).toBe(3);
    again.close();
  });
});

describe('uuid helpers edge cases', () => {
  it('composeUuidV7 rejects bad inputs', async () => {
    const { composeUuidV7, timestampOfUuidV7, isUuidV7 } = await import('../src/uuid-v7');
    expect(() => composeUuidV7(-1, 0, new Uint8Array(8))).toThrow(RangeError);
    expect(() => composeUuidV7(0, 99999, new Uint8Array(8))).toThrow(RangeError);
    expect(() => composeUuidV7(0, 0, new Uint8Array(4))).toThrow(RangeError);
    expect(isUuidV7('not-a-uuid')).toBe(false);
    expect(() => timestampOfUuidV7('not-a-uuid')).toThrow(RangeError);
  });
});

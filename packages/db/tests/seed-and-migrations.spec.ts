/**
 * Seed demo contract [BR6.1] and migration reversibility [BR1.2].
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEMO_PRODUCT_COUNT,
  DEVELOPMENT_FALLBACK_KEY,
  LATEST_SCHEMA_VERSION,
  countProducts,
  countSalesTables,
  countUsers,
  openEncryptedDatabase,
  seedDemoDatabase,
} from '../src/index';
import { cleanupTempDirs, openTempDb, tempDbPath } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('seed demo [BR6.1]', () => {
  it('creates 3 users, 200 products, zero sales tables', () => {
    const db = openTempDb();
    const result = seedDemoDatabase(db);
    expect(countUsers(db, result.tenantId)).toBe(3);
    expect(countProducts(db, result.tenantId)).toBe(DEMO_PRODUCT_COUNT);
    expect(result.productCount).toBe(200);
    expect(result.sellingUnitCount).toBe(200);
    expect(countSalesTables()).toBe(0);

    const sales = db.connection
      .prepare<[], { name: string }>(
        `SELECT name FROM sqlite_schema WHERE type = 'table' AND name LIKE '%sale%'`,
      )
      .all();
    expect(sales).toHaveLength(0);
    db.close();
  });

  it('seeds distinct roles', () => {
    const db = openTempDb();
    const result = seedDemoDatabase(db);
    const roles = db.connection
      .prepare<[string], { role: string }>(
        'SELECT role FROM users WHERE tenant_id = ? ORDER BY role',
      )
      .all(result.tenantId)
      .map((row) => row.role);
    expect(roles).toEqual(['gerant', 'proprietaire', 'vendeur']);
    db.close();
  });
});

describe('migrations reversibility [BR1.2]', () => {
  it('applies foundation schema to version 2', () => {
    const db = openTempDb();
    expect(db.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(LATEST_SCHEMA_VERSION).toBe(3);
    const tables = db.connection
      .prepare<[], { name: string }>(
        `SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name`,
      )
      .all()
      .map((row) => row.name);
    expect(tables).toContain('tenants');
    expect(tables).toContain('products');
    expect(tables).toContain('audit_log');
    expect(tables).toContain('outbox');
    expect(tables).toContain('probe_entries');
    db.close();
  });

  it('migrates down to 0 then back up', () => {
    const path = tempDbPath('migrate.db');
    const db = openEncryptedDatabase({
      filePath: path,
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
    expect(db.migrateDown(0)).toBe(3);
    expect(db.schemaVersion).toBe(0);
    expect(db.migrateUp()).toBe(3);
    expect(db.schemaVersion).toBe(3);
    db.close();
  });

  it('preserves probe_entries across foundation migration', () => {
    const db = openTempDb();
    db.insertProbeEntry('alive');
    expect(db.countProbeEntries()).toBe(1);
    db.close();
  });
});

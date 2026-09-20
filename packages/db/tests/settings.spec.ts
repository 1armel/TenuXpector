/**
 * Settings typed reads, defaults, store override [BR3.1 BR3.2].
 */
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsService, ValidationError } from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('SettingsService [BR3.1 BR3.2]', () => {
  it('returns documented default when no row exists', () => {
    const { db, tenantId } = createIdentityFixture();
    const settings = new SettingsService(db);
    expect(settings.get(tenantId, 'currency')).toBe('FCFA');
    expect(settings.get(tenantId, 'tva_rate_bps')).toBe(1925);
    db.close();
  });

  it('prefers store override over tenant value', () => {
    const { db, tenantId, storeId, proprietaireId } = createIdentityFixture();
    db.connection
      .prepare(
        `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
         VALUES (?, ?, NULL, 'tva_rate_bps', ?, ?, ?, 'test-device')`,
      )
      .run(db.nextId(), tenantId, JSON.stringify(1000), db.nowIso(), proprietaireId);
    db.connection
      .prepare(
        `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
         VALUES (?, ?, ?, 'tva_rate_bps', ?, ?, ?, 'test-device')`,
      )
      .run(db.nextId(), tenantId, storeId, JSON.stringify(500), db.nowIso(), proprietaireId);

    const settings = new SettingsService(db);
    expect(settings.get(tenantId, 'tva_rate_bps')).toBe(1000);
    expect(settings.get(tenantId, 'tva_rate_bps', storeId)).toBe(500);
    db.close();
  });

  it('rejects invalid stored JSON shape', () => {
    const { db, tenantId, proprietaireId } = createIdentityFixture();
    db.connection
      .prepare(
        `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
         VALUES (?, ?, NULL, 'currency', ?, ?, ?, 'test-device')`,
      )
      .run(db.nextId(), tenantId, JSON.stringify('EUR'), db.nowIso(), proprietaireId);

    const settings = new SettingsService(db);
    expect(() => settings.get(tenantId, 'currency')).toThrow(ValidationError);
    db.close();
  });

  it('reads payment_modes array', () => {
    const { db, tenantId, proprietaireId } = createIdentityFixture();
    db.connection
      .prepare(
        `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
         VALUES (?, ?, NULL, 'payment_modes', ?, ?, ?, 'test-device')`,
      )
      .run(
        db.nextId(),
        tenantId,
        JSON.stringify(['cash', 'card']),
        db.nowIso(),
        proprietaireId,
      );
    const settings = new SettingsService(db);
    expect(settings.get(tenantId, 'payment_modes')).toEqual(['cash', 'card']);
    db.close();
  });
});

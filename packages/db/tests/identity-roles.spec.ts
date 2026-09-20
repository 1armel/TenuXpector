/**
 * Identity gerant assign / revoke [BR2.4, R-05].
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ValidationError } from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('Identity gerant roles [BR2.4 R-05]', () => {
  it('assigns gerant and demotes previous gerant to vendeur', () => {
    const { db, identity, context, tenantId, gerantId, vendeurId } = createIdentityFixture();
    identity.assignGerant(context, vendeurId);

    expect(identity.getUser(tenantId, vendeurId)?.role).toBe('gerant');
    expect(identity.getUser(tenantId, gerantId)?.role).toBe('vendeur');

    const audits = db.connection
      .prepare<[string], { action: string }>(
        'SELECT action FROM audit_log WHERE tenant_id = ? ORDER BY recorded_at',
      )
      .all(tenantId)
      .map((row) => row.action);
    expect(audits).toContain('ROLE_ASSIGNE');
    expect(audits).toContain('ROLE_REVOQUE');

    const outbox = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    expect(outbox?.n).toBeGreaterThanOrEqual(1);
    db.close();
  });

  it('revokes gerant to vendeur', () => {
    const { db, identity, context, tenantId, gerantId } = createIdentityFixture();
    identity.revokeGerant(context, gerantId);
    expect(identity.getUser(tenantId, gerantId)?.role).toBe('vendeur');
    const audit = db.connection
      .prepare<[string], { action: string }>(
        `SELECT action FROM audit_log WHERE tenant_id = ? AND action = 'ROLE_REVOQUE'`,
      )
      .get(tenantId);
    expect(audit?.action).toBe('ROLE_REVOQUE');
    db.close();
  });

  it('refuses assign when actor is not proprietaire', () => {
    const { db, identity, tenantId, gerantId, vendeurId } = createIdentityFixture();
    expect(() =>
      identity.assignGerant(
        { tenantId, actorUserId: gerantId, deviceId: 'test-device' },
        vendeurId,
      ),
    ).toThrow(ValidationError);
    db.close();
  });

  it('enforces at most one active gerant via unique index', () => {
    const { db, identity, tenantId, storeId, proprietaireId } = createIdentityFixture();
    const extra = db.nextId();
    expect(() =>
      identity.createUser({
        id: extra,
        tenantId,
        name: 'Second Manager',
        pin: '4444',
        role: 'gerant',
        allowedStoreIds: [storeId],
        createdBy: proprietaireId,
        deviceId: 'test-device',
      }),
    ).toThrow();
    db.close();
  });
});

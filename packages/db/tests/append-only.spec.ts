/**
 * Append-only invariants for audit_log and pin_attempts [BR1.3] — tests first.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('append-only audit_log [BR1.3]', () => {
  it('accepts INSERT of an audit row', () => {
    const { db, context } = createIdentityFixture();
    const id = db.nextId();
    expect(() =>
      db.connection
        .prepare(
          `INSERT INTO audit_log (
            id, tenant_id, user_id, session_id, action, entity_kind, entity_id,
            before_json, after_json, device_id, recorded_at
          ) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, NULL, ?, ?)`,
        )
        .run(
          id,
          context.tenantId,
          context.actorUserId,
          'TEST',
          'user',
          context.actorUserId,
          context.deviceId,
          db.nowIso(),
        ),
    ).not.toThrow();
    const count = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM audit_log WHERE tenant_id = ?')
      .get(context.tenantId);
    expect(count?.n).toBe(1);
    db.close();
  });

  it('rejects UPDATE on audit_log', () => {
    const { db, context } = createIdentityFixture();
    const id = db.nextId();
    db.connection
      .prepare(
        `INSERT INTO audit_log (
          id, tenant_id, user_id, session_id, action, entity_kind, entity_id,
          before_json, after_json, device_id, recorded_at
        ) VALUES (?, ?, ?, NULL, 'TEST', 'user', ?, NULL, NULL, ?, ?)`,
      )
      .run(id, context.tenantId, context.actorUserId, context.actorUserId, context.deviceId, db.nowIso());

    expect(() =>
      db.connection.prepare('UPDATE audit_log SET action = ? WHERE id = ?').run('HACK', id),
    ).toThrow(/append-only/i);
    db.close();
  });

  it('rejects DELETE on audit_log', () => {
    const { db, context } = createIdentityFixture();
    const id = db.nextId();
    db.connection
      .prepare(
        `INSERT INTO audit_log (
          id, tenant_id, user_id, session_id, action, entity_kind, entity_id,
          before_json, after_json, device_id, recorded_at
        ) VALUES (?, ?, ?, NULL, 'TEST', 'user', ?, NULL, NULL, ?, ?)`,
      )
      .run(id, context.tenantId, context.actorUserId, context.actorUserId, context.deviceId, db.nowIso());

    expect(() => db.connection.prepare('DELETE FROM audit_log WHERE id = ?').run(id)).toThrow(
      /append-only/i,
    );
    db.close();
  });
});

describe('append-only pin_attempts [BR1.3 / BR2.3]', () => {
  it('accepts INSERT via Identity.recordPinAttempt', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const attempt = identity.recordPinAttempt({
      tenantId,
      userId: vendeurId,
      success: false,
      deviceId: 'test-device',
    });
    expect(attempt.success).toBe(false);
    expect(identity.countPinAttempts(tenantId, vendeurId)).toBe(1);
    db.close();
  });

  it('rejects UPDATE on pin_attempts', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const attempt = identity.recordPinAttempt({
      tenantId,
      userId: vendeurId,
      success: false,
      deviceId: 'test-device',
    });
    expect(() =>
      db.connection.prepare('UPDATE pin_attempts SET success = 1 WHERE id = ?').run(attempt.id),
    ).toThrow(/append-only/i);
    db.close();
  });

  it('rejects DELETE on pin_attempts', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const attempt = identity.recordPinAttempt({
      tenantId,
      userId: vendeurId,
      success: true,
      deviceId: 'test-device',
    });
    expect(() =>
      db.connection.prepare('DELETE FROM pin_attempts WHERE id = ?').run(attempt.id),
    ).toThrow(/append-only/i);
    db.close();
  });
});

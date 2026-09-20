/**
 * Outbox same-transaction invariants [BR4.1–BR4.3] — tests first.
 * PinAttempt must NOT write outbox (R-03).
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  MissingOutboxError,
  TransactionalWriter,
  insertProductRow,
  insertSellingUnitRow,
  BASE_UNIT_CONVERSION_FACTOR,
} from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('TransactionalWriter outbox same TX [BR4.1 BR4.2]', () => {
  it('commits mutation + audit + outbox atomically', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const productId = db.nextId();

    const result = writer.commit({
      context,
      apply: () => {
        insertProductRow(
          db,
          {
            id: productId,
            tenantId,
            internalCode: 'P-1',
            name: 'Nail',
            baseUnit: 'piece',
            referencePrice: 100,
            floorPrice: 80,
            createdBy: context.actorUserId,
            deviceId: context.deviceId,
          },
          db.nowIso(),
        );
        insertSellingUnitRow(
          db,
          {
            id: db.nextId(),
            tenantId,
            productId,
            label: 'piece',
            conversionFactor: BASE_UNIT_CONVERSION_FACTOR,
            price: 100,
            floorPrice: 80,
            createdBy: context.actorUserId,
            deviceId: context.deviceId,
          },
          db.nowIso(),
        );
      },
      audit: {
        action: 'PRODUCT_CREATED',
        entityKind: 'product',
        entityId: productId,
        after: { internalCode: 'P-1' },
      },
      outbox: {
        eventKind: 'product.created',
        entityId: productId,
        payload: { productId },
      },
    });

    expect(result.outboxIds).toHaveLength(1);
    expect(result.localSequences[0]).toBe(1);
    const products = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM products WHERE tenant_id = ?')
      .get(tenantId);
    const outbox = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    const audits = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM audit_log WHERE tenant_id = ?')
      .get(tenantId);
    expect(products?.n).toBe(1);
    expect(outbox?.n).toBe(1);
    expect(audits?.n).toBe(1);
    db.close();
  });

  it('refuses commit when outbox is null [BR4.2]', () => {
    const { db, context } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    expect(() =>
      writer.commit({
        context,
        apply: () => undefined,
        audit: {
          action: 'NOPE',
          entityKind: 'user',
          entityId: context.actorUserId,
        },
        outbox: null,
      }),
    ).toThrow(MissingOutboxError);
    db.close();
  });

  it('rolls back mutation when apply throws', () => {
    const { db, context, tenantId } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    expect(() =>
      writer.commit({
        context,
        apply: () => {
          throw new Error('boom');
        },
        audit: {
          action: 'X',
          entityKind: 'user',
          entityId: context.actorUserId,
        },
        outbox: {
          eventKind: 'x',
          entityId: context.actorUserId,
          payload: {},
        },
      }),
    ).toThrow('boom');

    const outbox = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    const audits = db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM audit_log WHERE tenant_id = ?')
      .get(tenantId);
    expect(outbox?.n).toBe(0);
    expect(audits?.n).toBe(0);
    db.close();
  });

  it('assigns strictly increasing localSequence per tenant [BR4.3]', () => {
    const { db, context } = createIdentityFixture();
    const writer = new TransactionalWriter(db);
    const first = writer.commit({
      context,
      apply: () => undefined,
      audit: {
        action: 'A',
        entityKind: 'user',
        entityId: context.actorUserId,
      },
      outbox: { eventKind: 'a', entityId: context.actorUserId, payload: { n: 1 } },
    });
    const second = writer.commit({
      context,
      apply: () => undefined,
      audit: {
        action: 'B',
        entityKind: 'user',
        entityId: context.actorUserId,
      },
      outbox: { eventKind: 'b', entityId: context.actorUserId, payload: { n: 2 } },
    });
    expect(first.localSequences[0]).toBe(1);
    expect(second.localSequences[0]).toBe(2);
    db.close();
  });
});

describe('PinAttempt without outbox [R-03]', () => {
  it('records PinAttempt without creating OutboxEvent', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const before = identity.countOutboxForTenant(tenantId);
    identity.recordPinAttempt({
      tenantId,
      userId: vendeurId,
      success: false,
      deviceId: 'test-device',
    });
    expect(identity.countOutboxForTenant(tenantId)).toBe(before);
    expect(identity.countPinAttempts(tenantId, vendeurId)).toBe(1);
    db.close();
  });

  it('verifyPin appends attempt and still leaves outbox empty on failure', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const result = identity.verifyPin(tenantId, vendeurId, '0000', 'test-device');
    expect(result.ok).toBe(false);
    expect(identity.countOutboxForTenant(tenantId)).toBe(0);
    expect(identity.countPinAttempts(tenantId, vendeurId)).toBe(1);
    db.close();
  });
});

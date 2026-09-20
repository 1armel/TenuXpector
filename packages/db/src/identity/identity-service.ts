/**
 * Identity — offline PIN auth, PinAttempt append (no outbox, R-03), gerant assign/revoke [BR2.x].
 */
import type { EncryptedDatabase } from '../encrypted-database';
import { createPinMaterial, verifyPinAgainstMaterial } from './pin';
import { TransactionalWriter, assertTenantMatch } from '../transactional-writer';
import {
  PIN_LOCKOUT_FAILURES,
  PIN_LOCKOUT_WINDOW_MS,
  ValidationError,
  err,
  ok,
  type Result,
  type TenantContext,
  type UserRole,
} from '../types';
import { isUuidV7 } from '../uuid-v7';

export type PinVerifyError =
  | 'user_not_found'
  | 'user_inactive'
  | 'pin_locked'
  | 'pin_invalid'
  | 'tenant_mismatch';

export interface UserRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly phone: string | null;
  readonly role: UserRole;
  readonly allowedStoreIds: readonly string[];
  readonly active: boolean;
  readonly lastActivityAt: string | null;
  readonly pinHash: string;
  readonly pinSalt: string;
  readonly pinIterations: number;
}

interface UserRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly phone: string | null;
  readonly pin_hash: string;
  readonly pin_salt: string;
  readonly pin_iterations: number;
  readonly role: UserRole;
  readonly allowed_store_ids: string;
  readonly active: number;
  readonly last_activity_at: string | null;
}

function mapUser(row: UserRow): UserRecord {
  const allowed: unknown = JSON.parse(row.allowed_store_ids);
  if (!Array.isArray(allowed) || !allowed.every((id) => typeof id === 'string')) {
    throw new ValidationError('allowed_store_ids must be a JSON string array');
  }
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    allowedStoreIds: allowed,
    active: row.active === 1,
    lastActivityAt: row.last_activity_at,
    pinHash: row.pin_hash,
    pinSalt: row.pin_salt,
    pinIterations: row.pin_iterations,
  };
}

export interface CreateUserInput {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly phone?: string;
  readonly pin: string;
  readonly role: UserRole;
  readonly allowedStoreIds: readonly string[];
  readonly createdBy: string;
  readonly deviceId: string;
  readonly active?: boolean;
}

export interface PinAttemptRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly success: boolean;
  readonly attemptedAt: string;
  readonly deviceId: string;
}

export class IdentityService {
  readonly #writer: TransactionalWriter;

  constructor(private readonly db: EncryptedDatabase) {
    this.#writer = new TransactionalWriter(db);
  }

  getUser(tenantId: string, userId: string): UserRecord | undefined {
    const row = this.db.connection
      .prepare<[string, string], UserRow>(
        `SELECT id, tenant_id, name, phone, pin_hash, pin_salt, pin_iterations,
                role, allowed_store_ids, active, last_activity_at
         FROM users WHERE id = ? AND tenant_id = ?`,
      )
      .get(userId, tenantId);
    return row === undefined ? undefined : mapUser(row);
  }

  createUser(input: CreateUserInput): UserRecord {
    if (!isUuidV7(input.id)) throw new ValidationError('User id must be UUID v7 [BR1.4]');
    const material = createPinMaterial(input.pin);
    const createdAt = this.db.nowIso();
    this.db.connection
      .prepare(
        `INSERT INTO users (
          id, tenant_id, name, phone, pin_hash, pin_salt, pin_iterations,
          role, allowed_store_ids, active, last_activity_at, created_at, created_by, device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      )
      .run(
        input.id,
        input.tenantId,
        input.name,
        input.phone ?? null,
        material.pinHash,
        material.pinSalt,
        material.pinIterations,
        input.role,
        JSON.stringify(input.allowedStoreIds),
        input.active === false ? 0 : 1,
        createdAt,
        input.createdBy,
        input.deviceId,
      );
    const created = this.getUser(input.tenantId, input.id);
    if (created === undefined) throw new Error('User insert failed');
    return created;
  }

  countRecentFailures(tenantId: string, userId: string, windowMs: number = PIN_LOCKOUT_WINDOW_MS): number {
    const since = new Date(this.db.nowMs() - windowMs).toISOString();
    const row = this.db.connection
      .prepare<[string, string, string], { n: number }>(
        `SELECT COUNT(*) AS n FROM pin_attempts
         WHERE tenant_id = ? AND user_id = ? AND success = 0 AND attempted_at >= ?`,
      )
      .get(tenantId, userId, since);
    return row?.n ?? 0;
  }

  isPinLocked(tenantId: string, userId: string): boolean {
    return this.countRecentFailures(tenantId, userId) >= PIN_LOCKOUT_FAILURES;
  }

  /**
   * Appends a PinAttempt without OutboxEvent (R-03 / BR2.3).
   */
  recordPinAttempt(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly success: boolean;
    readonly deviceId: string;
    readonly registerId?: string;
  }): PinAttemptRecord {
    const id = this.db.nextId();
    const attemptedAt = this.db.nowIso();
    this.db.connection
      .prepare(
        `INSERT INTO pin_attempts (
          id, tenant_id, user_id, register_id, attempted_at, success, device_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.tenantId,
        input.userId,
        input.registerId ?? null,
        attemptedAt,
        input.success ? 1 : 0,
        input.deviceId,
      );
    return {
      id,
      tenantId: input.tenantId,
      userId: input.userId,
      success: input.success,
      attemptedAt,
      deviceId: input.deviceId,
    };
  }

  verifyPin(
    tenantId: string,
    userId: string,
    pin: string,
    deviceId: string,
  ): Result<UserRecord, PinVerifyError> {
    const user = this.getUser(tenantId, userId);
    if (user === undefined) return err('user_not_found');
    assertTenantMatch(tenantId, user.tenantId);
    if (!user.active) {
      this.recordPinAttempt({ tenantId, userId, success: false, deviceId });
      return err('user_inactive');
    }
    if (this.isPinLocked(tenantId, userId)) {
      this.recordPinAttempt({ tenantId, userId, success: false, deviceId });
      return err('pin_locked');
    }

    const matched = verifyPinAgainstMaterial(pin, {
      pinHash: user.pinHash,
      pinSalt: user.pinSalt,
      pinIterations: user.pinIterations,
    });

    this.recordPinAttempt({ tenantId, userId, success: matched, deviceId });

    if (!matched) {
      return err(this.isPinLocked(tenantId, userId) ? 'pin_locked' : 'pin_invalid');
    }

    const lastActivityAt = this.db.nowIso();
    this.db.connection
      .prepare('UPDATE users SET last_activity_at = ? WHERE id = ? AND tenant_id = ?')
      .run(lastActivityAt, userId, tenantId);

    const refreshed = this.getUser(tenantId, userId);
    if (refreshed === undefined) return err('user_not_found');
    return ok(refreshed);
  }

  /**
   * Assigns gerant to target; demotes any other active gerant to vendeur (R-05).
   * Only proprietaire may call. Writes audit + outbox via TransactionalWriter.
   */
  assignGerant(context: TenantContext, targetUserId: string): void {
    const actor = this.getUser(context.tenantId, context.actorUserId);
    if (actor?.role !== 'proprietaire') {
      throw new ValidationError('Only proprietaire may assign gerant [BR2.4]');
    }
    const target = this.getUser(context.tenantId, targetUserId);
    if (target?.active !== true) {
      throw new ValidationError('Target user must be active in the same tenant [BR2.4]');
    }

    const previousGerants = this.db.connection
      .prepare<[string, string], { id: string; role: UserRole }>(
        `SELECT id, role FROM users
         WHERE tenant_id = ? AND role = 'gerant' AND active = 1 AND id != ?`,
      )
      .all(context.tenantId, targetUserId);

    this.#writer.commit({
      context,
      apply: () => {
        for (const previous of previousGerants) {
          this.db.connection
            .prepare(`UPDATE users SET role = 'vendeur' WHERE id = ? AND tenant_id = ?`)
            .run(previous.id, context.tenantId);
        }
        this.db.connection
          .prepare(`UPDATE users SET role = 'gerant' WHERE id = ? AND tenant_id = ?`)
          .run(targetUserId, context.tenantId);
      },
      audit: [
        ...previousGerants.map((previous) => ({
          action: 'ROLE_REVOQUE',
          entityKind: 'user',
          entityId: previous.id,
          before: { role: 'gerant' },
          after: { role: 'vendeur' },
        })),
        {
          action: 'ROLE_ASSIGNE',
          entityKind: 'user',
          entityId: targetUserId,
          before: { role: target.role },
          after: { role: 'gerant' },
        },
      ],
      outbox: {
        eventKind: 'user.gerant_assigned',
        entityId: targetUserId,
        payload: {
          targetUserId,
          demotedUserIds: previousGerants.map((row) => row.id),
        },
      },
    });
  }

  /**
   * Revokes gerant → vendeur (R-05). Audit + outbox in the same transaction.
   */
  revokeGerant(context: TenantContext, targetUserId: string): void {
    const actor = this.getUser(context.tenantId, context.actorUserId);
    if (actor?.role !== 'proprietaire') {
      throw new ValidationError('Only proprietaire may revoke gerant [BR2.4]');
    }
    const target = this.getUser(context.tenantId, targetUserId);
    if (target?.role !== 'gerant') {
      throw new ValidationError('Target must be an active gerant [BR2.4]');
    }

    this.#writer.commit({
      context,
      apply: () => {
        this.db.connection
          .prepare(`UPDATE users SET role = 'vendeur' WHERE id = ? AND tenant_id = ?`)
          .run(targetUserId, context.tenantId);
      },
      audit: {
        action: 'ROLE_REVOQUE',
        entityKind: 'user',
        entityId: targetUserId,
        before: { role: 'gerant' },
        after: { role: 'vendeur' },
      },
      outbox: {
        eventKind: 'user.gerant_revoked',
        entityId: targetUserId,
        payload: { targetUserId, newRole: 'vendeur' },
      },
    });
  }

  countOutboxForTenant(tenantId: string): number {
    const row = this.db.connection
      .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM outbox WHERE tenant_id = ?')
      .get(tenantId);
    return row?.n ?? 0;
  }

  countPinAttempts(tenantId: string, userId: string): number {
    const row = this.db.connection
      .prepare<[string, string], { n: number }>(
        'SELECT COUNT(*) AS n FROM pin_attempts WHERE tenant_id = ? AND user_id = ?',
      )
      .get(tenantId, userId);
    return row?.n ?? 0;
  }
}

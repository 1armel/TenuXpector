/**
 * TransactionalWriter — business mutation + AuditEntry + OutboxEvent in one TX [BR4.1–BR4.3].
 * PinAttempt is an explicit exception and must not use this path for outbox (R-03).
 */
import type { EncryptedDatabase } from './encrypted-database';
import { MissingOutboxError, TenantIsolationError, type TenantContext } from './types';
import { isUuidV7 } from './uuid-v7';

export interface AuditDraft {
  readonly action: string;
  readonly entityKind: string;
  readonly entityId: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly sessionId?: string;
}

export interface OutboxDraft {
  readonly eventKind: string;
  readonly entityId: string;
  readonly payload: unknown;
}

export interface CommitInput {
  readonly context: TenantContext;
  readonly apply: (db: EncryptedDatabase) => void;
  readonly audit: AuditDraft | readonly AuditDraft[];
  readonly outbox: OutboxDraft | readonly OutboxDraft[] | null;
}

export interface CommitResult {
  readonly auditIds: readonly string[];
  readonly outboxIds: readonly string[];
  readonly localSequences: readonly number[];
}

function asArray<T>(value: T | readonly T[]): T[] {
  return (Array.isArray(value) ? value : [value]) as T[];
}

function nextLocalSequence(db: EncryptedDatabase, tenantId: string): number {
  const row = db.connection
    .prepare<
      [string],
      { max_seq: number | null }
    >('SELECT MAX(local_sequence) AS max_seq FROM outbox WHERE tenant_id = ?')
    .get(tenantId);
  return (row?.max_seq ?? 0) + 1;
}

function insertAudit(db: EncryptedDatabase, context: TenantContext, draft: AuditDraft): string {
  if (!isUuidV7(draft.entityId)) {
    throw new Error(`entityId must be UUID v7: ${draft.entityId}`);
  }
  const id = db.nextId();
  db.connection
    .prepare(
      `INSERT INTO audit_log (
        id, tenant_id, user_id, session_id, action, entity_kind, entity_id,
        before_json, after_json, device_id, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      context.tenantId,
      context.actorUserId,
      draft.sessionId ?? null,
      draft.action,
      draft.entityKind,
      draft.entityId,
      draft.before === undefined ? null : JSON.stringify(draft.before),
      draft.after === undefined ? null : JSON.stringify(draft.after),
      context.deviceId,
      db.nowIso(),
    );
  return id;
}

function insertOutbox(
  db: EncryptedDatabase,
  context: TenantContext,
  draft: OutboxDraft,
  localSequence: number,
): string {
  const id = db.nextId();
  db.connection
    .prepare(
      `INSERT INTO outbox (
        id, tenant_id, event_kind, entity_id, payload, created_at, local_sequence
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      context.tenantId,
      draft.eventKind,
      draft.entityId,
      JSON.stringify(draft.payload),
      db.nowIso(),
      localSequence,
    );
  return id;
}

export class TransactionalWriter {
  constructor(private readonly db: EncryptedDatabase) {}

  /**
   * Atomically applies a business mutation with audit + outbox.
   * Passing `outbox: null` is refused — use Identity.recordPinAttempt for R-03.
   */
  commit(input: CommitInput): CommitResult {
    if (input.outbox === null) {
      throw new MissingOutboxError();
    }
    const audits = asArray(input.audit);
    const outboxes = asArray(input.outbox);
    if (outboxes.length === 0) {
      throw new MissingOutboxError();
    }

    return this.db.transaction(() => {
      input.apply(this.db);

      const auditIds: string[] = [];
      for (const draft of audits) {
        auditIds.push(insertAudit(this.db, input.context, draft));
      }

      const outboxIds: string[] = [];
      const localSequences: number[] = [];
      let sequence = nextLocalSequence(this.db, input.context.tenantId);
      for (const draft of outboxes) {
        outboxIds.push(insertOutbox(this.db, input.context, draft, sequence));
        localSequences.push(sequence);
        sequence += 1;
      }

      return { auditIds, outboxIds, localSequences };
    });
  }
}

export function assertTenantMatch(expectedTenantId: string, actualTenantId: string): void {
  if (expectedTenantId !== actualTenantId) {
    throw new TenantIsolationError(expectedTenantId, actualTenantId);
  }
}

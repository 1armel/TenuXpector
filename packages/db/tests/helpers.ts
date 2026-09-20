/**
 * Shared helpers for @tenu/db integration tests — real encrypted temp files.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DEVELOPMENT_FALLBACK_KEY,
  IdentityService,
  openEncryptedDatabase,
  type EncryptedDatabase,
  type TenantContext,
} from '../src/index';

const tempDirs: string[] = [];

export function tempDbPath(name = 'foundation.db'): string {
  const dir = mkdtempSync(join(tmpdir(), 'tenu-db-u2-'));
  tempDirs.push(dir);
  return join(dir, name);
}

export function cleanupTempDirs(): void {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
  }
}

export function openTempDb(now?: () => number): EncryptedDatabase {
  if (now === undefined) {
    return openEncryptedDatabase({
      filePath: tempDbPath(),
      encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    });
  }
  return openEncryptedDatabase({
    filePath: tempDbPath(),
    encryptionKey: DEVELOPMENT_FALLBACK_KEY,
    now,
  });
}

export interface Fixture {
  readonly db: EncryptedDatabase;
  readonly identity: IdentityService;
  readonly tenantId: string;
  readonly storeId: string;
  readonly proprietaireId: string;
  readonly gerantId: string;
  readonly vendeurId: string;
  readonly context: TenantContext;
}

export function createIdentityFixture(now?: () => number): Fixture {
  const db = openTempDb(now);
  const identity = new IdentityService(db);
  const tenantId = db.nextId();
  const storeId = db.nextId();
  const proprietaireId = db.nextId();
  const gerantId = db.nextId();
  const vendeurId = db.nextId();

  db.connection
    .prepare('INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)')
    .run(tenantId, 'Test Tenant', db.nowIso());
  db.connection
    .prepare(
      `INSERT INTO stores (id, tenant_id, name, created_at, created_by, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(storeId, tenantId, 'Test Store', db.nowIso(), proprietaireId, 'test-device');

  identity.createUser({
    id: proprietaireId,
    tenantId,
    name: 'Owner',
    pin: '1111',
    role: 'proprietaire',
    allowedStoreIds: [storeId],
    createdBy: proprietaireId,
    deviceId: 'test-device',
  });
  identity.createUser({
    id: gerantId,
    tenantId,
    name: 'Manager',
    pin: '2222',
    role: 'gerant',
    allowedStoreIds: [storeId],
    createdBy: proprietaireId,
    deviceId: 'test-device',
  });
  identity.createUser({
    id: vendeurId,
    tenantId,
    name: 'Clerk',
    pin: '3333',
    role: 'vendeur',
    allowedStoreIds: [storeId],
    createdBy: proprietaireId,
    deviceId: 'test-device',
  });

  return {
    db,
    identity,
    tenantId,
    storeId,
    proprietaireId,
    gerantId,
    vendeurId,
    context: {
      tenantId,
      actorUserId: proprietaireId,
      deviceId: 'test-device',
    },
  };
}

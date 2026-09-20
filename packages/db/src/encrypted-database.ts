/**
 * Encrypted local SQLite (NFR4 / NFR8 / NFR17).
 *
 * Lifted from U1 pc-proof so U2 foundation and later units share one engine.
 * WAL + synchronous=FULL; UUID v7 client-side; refuses plaintext SQLite files.
 */
import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import SqliteDatabase from 'better-sqlite3-multiple-ciphers';
import { createUuidV7Generator, type UuidV7Generator } from './uuid-v7';
import {
  CREATE_MIGRATIONS_TABLE_SQL,
  LATEST_SCHEMA_VERSION,
  migrationsToRevert,
  pendingMigrations,
} from './migrations';

export type SqliteConnection = InstanceType<typeof SqliteDatabase>;

const PLAINTEXT_SQLITE_HEADER = `SQLite format 3${String.fromCharCode(0)}`;

export const DEFAULT_CIPHER = 'sqlcipher';

export class UnencryptedDatabaseError extends Error {
  constructor(readonly filePath: string) {
    super(
      `File ${filePath} is a plaintext SQLite database. ` +
        'Refusing to open: the local database must be encrypted at rest (NFR8).',
    );
    this.name = 'UnencryptedDatabaseError';
  }
}

export class InvalidEncryptionKeyError extends Error {
  constructor(readonly filePath: string) {
    super(
      `Cannot decrypt ${filePath}: wrong encryption key, or unreadable file.`,
    );
    this.name = 'InvalidEncryptionKeyError';
  }
}

export class DatabaseIntegrityError extends Error {
  constructor(readonly details: string) {
    super(`Integrity check failed: ${details}`);
    this.name = 'DatabaseIntegrityError';
  }
}

export interface ProbeEntry {
  readonly id: string;
  readonly label: string;
  readonly sequence: number;
  readonly recordedAt: string;
}

interface ProbeEntryRow {
  readonly id: string;
  readonly label: string;
  readonly sequence: number;
  readonly recorded_at: string;
}

export interface OpenDatabaseOptions {
  readonly filePath: string;
  readonly encryptionKey: string;
  readonly cipher?: string;
  readonly now?: () => number;
  readonly randomBytes?: (size: number) => Uint8Array;
}

export function assertFileIsNotPlaintextSqlite(filePath: string): void {
  if (!existsSync(filePath)) return;
  if (statSync(filePath).size === 0) return;
  const header = readFileSync(filePath).subarray(0, 16).toString('latin1');
  if (header === PLAINTEXT_SQLITE_HEADER) throw new UnencryptedDatabaseError(filePath);
}

function readSchemaVersion(connection: SqliteConnection): number {
  const row = connection
    .prepare<[], { version: number | null }>('SELECT MAX(version) AS version FROM schema_migrations')
    .get();
  return row?.version ?? 0;
}

export class EncryptedDatabase {
  readonly #connection: SqliteConnection;
  readonly #ids: UuidV7Generator;
  readonly #now: () => number;
  #closed = false;

  private constructor(
    connection: SqliteConnection,
    readonly filePath: string,
    ids: UuidV7Generator,
    now: () => number,
  ) {
    this.#connection = connection;
    this.#ids = ids;
    this.#now = now;
  }

  static open(options: OpenDatabaseOptions): EncryptedDatabase {
    assertFileIsNotPlaintextSqlite(options.filePath);
    mkdirSync(dirname(options.filePath), { recursive: true });

    const connection: SqliteConnection = new SqliteDatabase(options.filePath);
    try {
      connection.pragma(`cipher='${options.cipher ?? DEFAULT_CIPHER}'`);
      connection.pragma(`key='${options.encryptionKey.replace(/'/g, "''")}'`);
      connection.prepare('SELECT count(*) AS n FROM sqlite_schema').get();
    } catch (error) {
      connection.close();
      if (error instanceof Error && /SQLITE_NOTADB|file is not a database/i.test(error.message)) {
        throw new InvalidEncryptionKeyError(options.filePath);
      }
      throw error;
    }

    connection.pragma('journal_mode = WAL');
    connection.pragma('synchronous = FULL');
    connection.pragma('foreign_keys = ON');
    connection.pragma('busy_timeout = 5000');

    const now = options.now ?? ((): number => Date.now());
    const randomBytes =
      options.randomBytes ?? ((size: number): Uint8Array => new Uint8Array(nodeRandomBytes(size)));
    const database = new EncryptedDatabase(
      connection,
      options.filePath,
      createUuidV7Generator({ now, randomBytes }),
      now,
    );
    database.migrateUp();
    return database;
  }

  /** Package services need the raw connection; callers outside @tenu/db should not. */
  get connection(): SqliteConnection {
    return this.#connection;
  }

  get journalMode(): string {
    const rows = this.#connection.pragma('journal_mode') as { journal_mode: string }[];
    return rows[0]?.journal_mode ?? 'unknown';
  }

  get synchronousMode(): number {
    const rows = this.#connection.pragma('synchronous') as { synchronous: number }[];
    return rows[0]?.synchronous ?? -1;
  }

  get schemaVersion(): number {
    return readSchemaVersion(this.#connection);
  }

  get isClosed(): boolean {
    return this.#closed;
  }

  nextId(): string {
    return this.#ids.next();
  }

  nowMs(): number {
    return this.#now();
  }

  nowIso(): string {
    return new Date(this.#now()).toISOString();
  }

  migrateUp(): number {
    this.#connection.exec(CREATE_MIGRATIONS_TABLE_SQL);
    let applied = 0;
    for (const migration of pendingMigrations(readSchemaVersion(this.#connection))) {
      const run = this.#connection.transaction(() => {
        migration.up(this.#connection);
        this.#connection
          .prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
          .run(migration.version, migration.name, new Date(this.#now()).toISOString());
      });
      run();
      applied += 1;
    }
    return applied;
  }

  migrateDown(targetVersion: number): number {
    let reverted = 0;
    for (const migration of migrationsToRevert(readSchemaVersion(this.#connection), targetVersion)) {
      const run = this.#connection.transaction(() => {
        migration.down(this.#connection);
        this.#connection
          .prepare('DELETE FROM schema_migrations WHERE version = ?')
          .run(migration.version);
      });
      run();
      reverted += 1;
    }
    return reverted;
  }

  insertProbeEntry(label: string): ProbeEntry {
    const entry: ProbeEntry = {
      id: this.#ids.next(),
      label,
      sequence: this.countProbeEntries() + 1,
      recordedAt: new Date(this.#now()).toISOString(),
    };
    this.#connection
      .prepare('INSERT INTO probe_entries (id, label, sequence, recorded_at) VALUES (?, ?, ?, ?)')
      .run(entry.id, entry.label, entry.sequence, entry.recordedAt);
    return entry;
  }

  insertProbeBatch(labelPrefix: string, count: number): number {
    const run = this.#connection.transaction((total: number) => {
      for (let index = 0; index < total; index += 1) {
        this.insertProbeEntry(`${labelPrefix}-${String(index)}`);
      }
    });
    run(count);
    return count;
  }

  countProbeEntries(): number {
    const row = this.#connection
      .prepare<[], { n: number }>('SELECT count(*) AS n FROM probe_entries')
      .get();
    return row?.n ?? 0;
  }

  listProbeEntries(): readonly ProbeEntry[] {
    const rows = this.#connection
      .prepare<
        [],
        ProbeEntryRow
      >('SELECT id, label, sequence, recorded_at FROM probe_entries ORDER BY sequence')
      .all();
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      sequence: row.sequence,
      recordedAt: row.recorded_at,
    }));
  }

  assertIntegrity(): void {
    const verdict = this.integrityCheck();
    if (verdict !== 'ok') throw new DatabaseIntegrityError(verdict);
  }

  integrityCheck(): string {
    const rows = this.#connection.pragma('integrity_check') as { integrity_check: string }[];
    return rows[0]?.integrity_check ?? 'unknown';
  }

  transaction<T>(work: () => T): T {
    return this.#connection.transaction(work)();
  }

  close(): void {
    if (this.#closed) return;
    this.#connection.pragma('wal_checkpoint(TRUNCATE)');
    this.#connection.close();
    this.#closed = true;
  }
}

export function openEncryptedDatabase(options: OpenDatabaseOptions): EncryptedDatabase {
  return EncryptedDatabase.open(options);
}

export { LATEST_SCHEMA_VERSION };

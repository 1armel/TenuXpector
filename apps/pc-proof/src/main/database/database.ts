/**
 * Base locale chiffrée (étape 9 du plan U1, NFR4 / NFR8 / NFR17).
 *
 * Trois choix portent tout le reste :
 *
 * 1. **Chiffrement au repos par SQLite3 Multiple Ciphers.** Le fichier sur
 *    disque ne commence pas par l'en-tête SQLite habituel ; une copie volée ne
 *    se lit pas. L'adaptateur refuse explicitement d'ouvrir un fichier *non*
 *    chiffré, plutôt que de le convertir en silence.
 * 2. **WAL + `synchronous = FULL`.** C'est la combinaison qui tient la promesse
 *    de NFR4 : une transaction validée est sur le disque avant que `COMMIT`
 *    ne rende la main. Le mode WAL seul, avec `synchronous = NORMAL`, perdrait
 *    les dernières transactions sur coupure d'alimentation.
 * 3. **Identifiants UUID v7 générés ici, pas par la base.** Aucun
 *    auto-incrément (CLAUDE.md).
 *
 * Une clé fausse, un fichier non chiffré ou une base corrompue sont des
 * violations d'invariant : elles lèvent une exception typée. Elles ne rendent
 * pas un résultat que l'appelant pourrait ignorer.
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

type SqliteConnection = InstanceType<typeof SqliteDatabase>;

/**
 * Seize premiers octets d'un fichier SQLite *non* chiffré : la chaîne
 * `SQLite format 3` suivie d'un octet nul. Composée ici plutôt qu'écrite en
 * clair, pour qu'aucune recherche textuelle ne la confonde avec une donnée.
 */
const PLAINTEXT_SQLITE_HEADER = `SQLite format 3${String.fromCharCode(0)}`;

export const DEFAULT_CIPHER = 'sqlcipher';

export class UnencryptedDatabaseError extends Error {
  constructor(readonly filePath: string) {
    super(
      `Le fichier ${filePath} est une base SQLite en clair. ` +
        "Refus d'ouverture : la base locale doit être chiffrée au repos (NFR8).",
    );
    this.name = 'UnencryptedDatabaseError';
  }
}

export class InvalidEncryptionKeyError extends Error {
  constructor(readonly filePath: string) {
    super(
      `Impossible de déchiffrer ${filePath} : clé de chiffrement incorrecte, ou fichier illisible.`,
    );
    this.name = 'InvalidEncryptionKeyError';
  }
}

export class DatabaseIntegrityError extends Error {
  constructor(readonly details: string) {
    super(`Contrôle d'intégrité en échec : ${details}`);
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
  /** Horloge injectée ; par défaut l'horloge système. */
  readonly now?: () => number;
  /** Source d'aléa injectée ; par défaut celle de Node. */
  readonly randomBytes?: (size: number) => Uint8Array;
}

/**
 * Refuse d'ouvrir un fichier SQLite en clair. Un fichier absent ou vide est
 * accepté : c'est une base neuve, qui sera chiffrée dès la première écriture.
 */
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
      // La clé traverse `pragma` ; elle n'est jamais journalisée (NFR8).
      connection.pragma(`key='${options.encryptionKey.replace(/'/g, "''")}'`);
      // Première lecture réelle : c'est elle qui révèle une clé fausse.
      connection.prepare('SELECT count(*) AS n FROM sqlite_schema').get();
    } catch (error) {
      connection.close();
      if (error instanceof Error && /SQLITE_NOTADB|file is not a database/i.test(error.message)) {
        throw new InvalidEncryptionKeyError(options.filePath);
      }
      throw error;
    }

    // Durabilité : c'est ici que se joue NFR4.
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

  get journalMode(): string {
    const rows = this.#connection.pragma('journal_mode') as { journal_mode: string }[];
    return rows[0]?.journal_mode ?? 'inconnu';
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

  /** Applique les migrations manquantes, chacune dans sa propre transaction. */
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

  /** Redescend le schéma jusqu'à `targetVersion`. Chaque `down` est joué. */
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

  /**
   * Écrit une ligne d'essai. L'identifiant est un UUID v7 décidé ici, jamais
   * par la base.
   */
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

  /**
   * Écrit `count` lignes dans **une seule** transaction. Utilisé par le banc
   * d'arrêts forcés : soit les `count` lignes sont là après réouverture, soit
   * aucune ne l'est. Une transaction partiellement visible serait un échec.
   */
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

  /** `PRAGMA integrity_check`. Lève si la base est corrompue. */
  assertIntegrity(): void {
    const verdict = this.integrityCheck();
    if (verdict !== 'ok') throw new DatabaseIntegrityError(verdict);
  }

  integrityCheck(): string {
    const rows = this.#connection.pragma('integrity_check') as { integrity_check: string }[];
    return rows[0]?.integrity_check ?? 'inconnu';
  }

  /** Exécute `work` dans une transaction ; toute exception annule tout. */
  transaction<T>(work: () => T): T {
    return this.#connection.transaction(work)();
  }

  close(): void {
    if (this.#closed) return;
    // Replie le WAL dans le fichier principal : un fichier déplacé sans son
    // `-wal` resterait cohérent.
    this.#connection.pragma('wal_checkpoint(TRUNCATE)');
    this.#connection.close();
    this.#closed = true;
  }
}

export function openEncryptedDatabase(options: OpenDatabaseOptions): EncryptedDatabase {
  return EncryptedDatabase.open(options);
}

export { LATEST_SCHEMA_VERSION };

/**
 * Migrations de la base locale (CLAUDE.md : « toute modification du schéma
 * s'accompagne d'une migration réversible »).
 *
 * Deux choses seulement dans cette unité :
 *   - `schema_migrations`, le registre des migrations appliquées ;
 *   - `probe_entries`, la table d'essai du banc de résistance.
 *
 * `probe_entries` **n'est pas une table métier**. Elle ne porte donc pas de
 * `tenant_id` et n'est soumise à aucun invariant d'ajout seul : elle existe
 * pour écrire vite, beaucoup, et vérifier ce qui survit à une coupure. Le
 * schéma métier — articles, ventes, mouvements, audit — arrive avec U2, et
 * c'est lui qui portera `tenant_id` et l'append-only.
 *
 * Chaque migration porte son `down`. La toute première aussi : une migration
 * qu'on ne sait pas défaire est une migration qu'on n'ose pas appliquer.
 */

export interface MigrationRunner {
  exec(sql: string): unknown;
}

export interface Migration {
  readonly version: number;
  readonly name: string;
  up(db: MigrationRunner): void;
  down(db: MigrationRunner): void;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'create-probe-entries',
    up(db) {
      db.exec(`
        CREATE TABLE probe_entries (
          id          TEXT    NOT NULL PRIMARY KEY,
          label       TEXT    NOT NULL,
          sequence    INTEGER NOT NULL,
          recorded_at TEXT    NOT NULL
        );
        CREATE INDEX probe_entries_sequence_idx ON probe_entries (sequence);
      `);
    },
    down(db) {
      db.exec(`
        DROP INDEX IF EXISTS probe_entries_sequence_idx;
        DROP TABLE IF EXISTS probe_entries;
      `);
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0,
);

export const CREATE_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER NOT NULL PRIMARY KEY,
    name       TEXT    NOT NULL,
    applied_at TEXT    NOT NULL
  );
`;

/** Migrations à appliquer pour passer de `currentVersion` à la dernière. */
export function pendingMigrations(currentVersion: number): readonly Migration[] {
  return MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
    (left, right) => left.version - right.version,
  );
}

/** Migrations à défaire pour redescendre de `currentVersion` à `targetVersion`. */
export function migrationsToRevert(
  currentVersion: number,
  targetVersion: number,
): readonly Migration[] {
  if (targetVersion >= currentVersion) return [];
  return MIGRATIONS.filter(
    (migration) => migration.version > targetVersion && migration.version <= currentVersion,
  ).sort((left, right) => right.version - left.version);
}

/**
 * Versioned reversible migrations for the local encrypted database.
 *
 * v1 — probe_entries (U1 pc-proof resilience bench; not a business table).
 * v2 — U2 foundation: identity, settings, catalog shape, audit_log, outbox.
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

const migrationProbeEntries: Migration = {
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
};

const migrationFoundation: Migration = {
  version: 2,
  name: 'create-foundation-schema',
  up(db) {
    db.exec(`
      CREATE TABLE tenants (
        id          TEXT NOT NULL PRIMARY KEY,
        name        TEXT NOT NULL,
        created_at  TEXT NOT NULL
      );

      CREATE TABLE stores (
        id          TEXT NOT NULL PRIMARY KEY,
        tenant_id   TEXT NOT NULL REFERENCES tenants(id),
        name        TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        created_by  TEXT NOT NULL,
        device_id   TEXT NOT NULL
      );
      CREATE INDEX stores_tenant_idx ON stores (tenant_id);

      CREATE TABLE users (
        id                TEXT    NOT NULL PRIMARY KEY,
        tenant_id         TEXT    NOT NULL REFERENCES tenants(id),
        name              TEXT    NOT NULL,
        phone             TEXT,
        pin_hash          TEXT    NOT NULL,
        pin_salt          TEXT    NOT NULL,
        pin_iterations    INTEGER NOT NULL CHECK (pin_iterations >= 310000),
        role              TEXT    NOT NULL CHECK (role IN ('vendeur', 'gerant', 'proprietaire')),
        allowed_store_ids TEXT    NOT NULL,
        active            INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        last_activity_at  TEXT,
        created_at        TEXT    NOT NULL,
        created_by        TEXT    NOT NULL,
        device_id         TEXT    NOT NULL
      );
      CREATE INDEX users_tenant_idx ON users (tenant_id);
      CREATE UNIQUE INDEX users_one_active_gerant_idx
        ON users (tenant_id)
        WHERE role = 'gerant' AND active = 1;

      CREATE TABLE pin_attempts (
        id           TEXT    NOT NULL PRIMARY KEY,
        tenant_id    TEXT    NOT NULL REFERENCES tenants(id),
        user_id      TEXT    NOT NULL REFERENCES users(id),
        register_id  TEXT,
        attempted_at TEXT    NOT NULL,
        success      INTEGER NOT NULL CHECK (success IN (0, 1)),
        device_id    TEXT    NOT NULL
      );
      CREATE INDEX pin_attempts_user_time_idx ON pin_attempts (tenant_id, user_id, attempted_at);

      CREATE TRIGGER pin_attempts_no_update
      BEFORE UPDATE ON pin_attempts
      BEGIN
        SELECT RAISE(ABORT, 'pin_attempts is append-only');
      END;

      CREATE TRIGGER pin_attempts_no_delete
      BEFORE DELETE ON pin_attempts
      BEGIN
        SELECT RAISE(ABORT, 'pin_attempts is append-only');
      END;

      CREATE TABLE settings (
        id          TEXT NOT NULL PRIMARY KEY,
        tenant_id   TEXT NOT NULL REFERENCES tenants(id),
        store_id    TEXT REFERENCES stores(id),
        key         TEXT NOT NULL,
        value       TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        created_by  TEXT NOT NULL,
        device_id   TEXT NOT NULL
      );
      CREATE UNIQUE INDEX settings_tenant_store_key_idx
        ON settings (tenant_id, IFNULL(store_id, ''), key);
      CREATE INDEX settings_tenant_idx ON settings (tenant_id);

      CREATE TABLE categories (
        id          TEXT NOT NULL PRIMARY KEY,
        tenant_id   TEXT NOT NULL REFERENCES tenants(id),
        name        TEXT NOT NULL,
        parent_id   TEXT REFERENCES categories(id),
        created_at  TEXT NOT NULL,
        created_by  TEXT NOT NULL,
        device_id   TEXT NOT NULL
      );
      CREATE INDEX categories_tenant_idx ON categories (tenant_id);

      CREATE TABLE products (
        id                     TEXT    NOT NULL PRIMARY KEY,
        tenant_id              TEXT    NOT NULL REFERENCES tenants(id),
        internal_code          TEXT    NOT NULL,
        barcode                TEXT,
        name                   TEXT    NOT NULL,
        alt_names              TEXT,
        category_id            TEXT REFERENCES categories(id),
        base_unit              TEXT    NOT NULL,
        average_purchase_cost  INTEGER,
        reference_price        INTEGER NOT NULL CHECK (reference_price >= 0),
        floor_price            INTEGER NOT NULL CHECK (floor_price >= 0),
        stock_alert_threshold  INTEGER,
        location               TEXT,
        active                 INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        created_at             TEXT    NOT NULL,
        created_by             TEXT    NOT NULL,
        device_id              TEXT    NOT NULL,
        CHECK (floor_price <= reference_price)
      );
      CREATE UNIQUE INDEX products_tenant_code_idx ON products (tenant_id, internal_code);
      CREATE INDEX products_tenant_idx ON products (tenant_id);

      CREATE TABLE selling_units (
        id                 TEXT    NOT NULL PRIMARY KEY,
        tenant_id          TEXT    NOT NULL REFERENCES tenants(id),
        product_id         TEXT    NOT NULL REFERENCES products(id),
        label              TEXT    NOT NULL,
        conversion_factor  INTEGER NOT NULL CHECK (conversion_factor >= 1),
        price              INTEGER NOT NULL CHECK (price >= 0),
        floor_price        INTEGER NOT NULL CHECK (floor_price >= 0),
        created_at         TEXT    NOT NULL,
        created_by         TEXT    NOT NULL,
        device_id          TEXT    NOT NULL,
        CHECK (floor_price <= price)
      );
      CREATE INDEX selling_units_product_idx ON selling_units (tenant_id, product_id);

      CREATE TABLE audit_log (
        id           TEXT NOT NULL PRIMARY KEY,
        tenant_id    TEXT NOT NULL REFERENCES tenants(id),
        user_id      TEXT NOT NULL REFERENCES users(id),
        session_id   TEXT,
        action       TEXT NOT NULL,
        entity_kind  TEXT NOT NULL,
        entity_id    TEXT NOT NULL,
        before_json  TEXT,
        after_json   TEXT,
        device_id    TEXT NOT NULL,
        recorded_at  TEXT NOT NULL
      );
      CREATE INDEX audit_log_tenant_idx ON audit_log (tenant_id, recorded_at);

      CREATE TRIGGER audit_log_no_update
      BEFORE UPDATE ON audit_log
      BEGIN
        SELECT RAISE(ABORT, 'audit_log is append-only');
      END;

      CREATE TRIGGER audit_log_no_delete
      BEFORE DELETE ON audit_log
      BEGIN
        SELECT RAISE(ABORT, 'audit_log is append-only');
      END;

      CREATE TABLE outbox (
        id              TEXT    NOT NULL PRIMARY KEY,
        tenant_id       TEXT    NOT NULL REFERENCES tenants(id),
        event_kind      TEXT    NOT NULL,
        entity_id       TEXT    NOT NULL,
        payload         TEXT    NOT NULL,
        created_at      TEXT    NOT NULL,
        local_sequence  INTEGER NOT NULL,
        UNIQUE (tenant_id, local_sequence)
      );
      CREATE INDEX outbox_tenant_seq_idx ON outbox (tenant_id, local_sequence);
    `);
  },
  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS outbox;
      DROP TRIGGER IF EXISTS audit_log_no_delete;
      DROP TRIGGER IF EXISTS audit_log_no_update;
      DROP TABLE IF EXISTS audit_log;
      DROP TABLE IF EXISTS selling_units;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS settings;
      DROP TRIGGER IF EXISTS pin_attempts_no_delete;
      DROP TRIGGER IF EXISTS pin_attempts_no_update;
      DROP TABLE IF EXISTS pin_attempts;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS stores;
      DROP TABLE IF EXISTS tenants;
    `);
  },
};

/** NFR3.1 / BR3.4 — normalized search blob + index for catalog lookup. */
const migrationCatalogSearch: Migration = {
  version: 3,
  name: 'catalog-search-normalized',
  up(db) {
    db.exec(`
      ALTER TABLE products ADD COLUMN search_normalized TEXT NOT NULL DEFAULT '';
      CREATE INDEX products_tenant_search_idx ON products (tenant_id, search_normalized);
      UPDATE products SET search_normalized = lower(
        coalesce(name, '') || ' ' ||
        coalesce(internal_code, '') || ' ' ||
        coalesce(barcode, '') || ' ' ||
        coalesce(alt_names, '')
      );
    `);
  },
  down(db) {
    db.exec(`
      DROP INDEX IF EXISTS products_tenant_search_idx;
      ALTER TABLE products DROP COLUMN search_normalized;
    `);
  },
};

export const MIGRATIONS: readonly Migration[] = [
  migrationProbeEntries,
  migrationFoundation,
  migrationCatalogSearch,
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

export function pendingMigrations(currentVersion: number): readonly Migration[] {
  return MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
    (left, right) => left.version - right.version,
  );
}

export function migrationsToRevert(
  currentVersion: number,
  targetVersion: number,
): readonly Migration[] {
  if (targetVersion >= currentVersion) return [];
  return MIGRATIONS.filter(
    (migration) => migration.version > targetVersion && migration.version <= currentVersion,
  ).sort((left, right) => right.version - left.version);
}

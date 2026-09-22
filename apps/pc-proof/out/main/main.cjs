"use strict";
const electron = require("electron");
const node_path = require("node:path");
const zod = require("zod");
const node_crypto = require("node:crypto");
const node_fs = require("node:fs");
const SqliteDatabase = require("better-sqlite3-multiple-ciphers");
const node_child_process = require("node:child_process");
const node_os = require("node:os");
const USER_ROLE_SCHEMA = zod.z.enum(["vendeur", "gerant", "proprietaire"]);
const catalogSessionSchema = zod.z.object({
  tenantId: zod.z.string().min(1),
  actorUserId: zod.z.string().min(1),
  deviceId: zod.z.string().min(1),
  role: USER_ROLE_SCHEMA
}).strict();
const catalogSearchRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  query: zod.z.string().max(200),
  limit: zod.z.number().int().min(1).max(50)
}).strict();
const productSummarySchema = zod.z.object({
  id: zod.z.string().min(1),
  internalCode: zod.z.string().min(1),
  name: zod.z.string().min(1),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  active: zod.z.boolean()
}).strict();
const catalogSearchResponseSchema = zod.z.object({
  items: zod.z.array(productSummarySchema)
}).strict();
const catalogGetProductRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  productId: zod.z.string().min(1)
}).strict();
const productViewSchema = zod.z.object({
  id: zod.z.string().min(1),
  internalCode: zod.z.string().min(1),
  name: zod.z.string().min(1),
  barcode: zod.z.string().nullable(),
  altNames: zod.z.array(zod.z.string()),
  categoryId: zod.z.string().nullable(),
  baseUnit: zod.z.string().min(1),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  stockAlertThreshold: zod.z.number().int().nullable(),
  location: zod.z.string().nullable(),
  active: zod.z.boolean(),
  /** Absent for vendeur [BR3.17]. */
  averagePurchaseCost: zod.z.number().int().nullable().optional()
}).strict();
const catalogGetProductResponseSchema = zod.z.object({
  product: productViewSchema.nullable()
}).strict();
const productWriteSchema = zod.z.object({
  designation: zod.z.string().min(1).max(200),
  baseUnit: zod.z.string().min(1).max(40),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  internalCode: zod.z.string().min(1).max(40).optional(),
  barcode: zod.z.string().max(64).optional(),
  altNames: zod.z.array(zod.z.string().max(120)).max(20).optional(),
  categoryId: zod.z.string().min(1).optional(),
  location: zod.z.string().max(120).optional(),
  averagePurchaseCost: zod.z.number().int().min(0).optional(),
  stockAlertThreshold: zod.z.number().int().min(0).optional(),
  productId: zod.z.string().min(1).optional()
}).strict();
const catalogSaveProductRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  mode: zod.z.enum(["create", "update"]),
  fields: productWriteSchema
}).strict();
const catalogSaveProductResponseSchema = zod.z.object({
  productId: zod.z.string().min(1),
  internalCode: zod.z.string().min(1)
}).strict();
const MAX_PAYLOAD_BYTES = 64 * 1024;
const PRINT_TARGETS = ["preview", "usb", "spooler"];
const openDatabaseRequestSchema = zod.z.object({}).strict();
const openDatabaseResponseSchema = zod.z.object({
  /** Chemin du fichier ouvert — utile au diagnostic, jamais la clé. */
  path: zod.z.string().min(1),
  encrypted: zod.z.literal(true),
  journalMode: zod.z.string().min(1),
  schemaVersion: zod.z.number().int().min(0),
  /** Présent quand le seed démo a été chargé ou était déjà là (C1). */
  demoSession: zod.z.object({
    tenantId: zod.z.string().min(1),
    proprietaireId: zod.z.string().min(1),
    gerantId: zod.z.string().min(1),
    vendeurId: zod.z.string().min(1)
  }).nullable()
}).strict();
const writeProbeRequestSchema = zod.z.object({
  label: zod.z.string().min(1).max(120)
}).strict();
const writeProbeResponseSchema = zod.z.object({
  id: zod.z.string().min(1),
  label: zod.z.string().min(1),
  /** Horodatage de stockage : UTC, forme ISO 8601. */
  recordedAt: zod.z.string().min(1),
  /** Nombre total de lignes d'essai après écriture. */
  total: zod.z.number().int().min(1)
}).strict();
const printProbeRequestSchema = zod.z.object({
  target: zod.z.enum(PRINT_TARGETS),
  label: zod.z.string().min(1).max(120),
  /** Montant de démonstration, en entiers de FCFA (DEC-04). */
  amountFcfa: zod.z.number().int().min(0)
}).strict();
const printProbeResponseSchema = zod.z.object({
  /**
   * `false` n'est pas une erreur : une impression peut échouer sans que
   * l'opération appelante échoue. C'est précisément l'invariant que cette
   * unité doit prouver.
   */
  printed: zod.z.boolean(),
  via: zod.z.enum(PRINT_TARGETS),
  byteCount: zod.z.number().int().min(0),
  /** Renseigné seulement quand `printed` vaut `false`. */
  reason: zod.z.string().nullable(),
  preview: zod.z.string()
}).strict();
const IPC_CHANNELS = {
  openDatabase: "tenu:database:open",
  writeProbe: "tenu:database:write-probe",
  printProbe: "tenu:printer:print-probe",
  catalogSearch: "tenu:catalog:search",
  catalogGetProduct: "tenu:catalog:get-product",
  catalogSaveProduct: "tenu:catalog:save-product"
};
const IPC_CONTRACT = {
  [IPC_CHANNELS.openDatabase]: {
    request: openDatabaseRequestSchema,
    response: openDatabaseResponseSchema
  },
  [IPC_CHANNELS.writeProbe]: {
    request: writeProbeRequestSchema,
    response: writeProbeResponseSchema
  },
  [IPC_CHANNELS.printProbe]: {
    request: printProbeRequestSchema,
    response: printProbeResponseSchema
  },
  [IPC_CHANNELS.catalogSearch]: {
    request: catalogSearchRequestSchema,
    response: catalogSearchResponseSchema
  },
  [IPC_CHANNELS.catalogGetProduct]: {
    request: catalogGetProductRequestSchema,
    response: catalogGetProductResponseSchema
  },
  [IPC_CHANNELS.catalogSaveProduct]: {
    request: catalogSaveProductRequestSchema,
    response: catalogSaveProductResponseSchema
  }
};
function isKnownChannel(channel) {
  return Object.prototype.hasOwnProperty.call(IPC_CONTRACT, channel);
}
function payloadByteLength(payload) {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function validate(schema, payload, code) {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, value: parsed.data };
  const detail = parsed.error.issues.map((issue) => `${issue.path.join(".") || "<racine>"} : ${issue.message}`).join(" ; ");
  return { ok: false, code, message: detail };
}
function success(value) {
  return { ok: true, value };
}
function failure(code, message) {
  return { ok: false, code, message };
}
function describeError(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue";
}
class IpcBackendError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "IpcBackendError";
  }
  code;
}
async function invokeBackend(channel, request, backend) {
  switch (channel) {
    case IPC_CHANNELS.openDatabase:
      return backend.openDatabase(request);
    case IPC_CHANNELS.writeProbe:
      return backend.writeProbe(request);
    case IPC_CHANNELS.printProbe:
      return backend.printProbe(request);
    case IPC_CHANNELS.catalogSearch:
      return backend.catalogSearch(request);
    case IPC_CHANNELS.catalogGetProduct:
      return backend.catalogGetProduct(request);
    case IPC_CHANNELS.catalogSaveProduct:
      return backend.catalogSaveProduct(request);
    default:
      throw new IpcBackendError("UNKNOWN_CHANNEL", `Canal non traité : ${channel}`);
  }
}
async function dispatchIpcRequest(channel, payload, backend) {
  if (!isKnownChannel(channel)) {
    return failure("UNKNOWN_CHANNEL", `Canal inconnu : ${channel}`);
  }
  const size = payloadByteLength(payload);
  if (size > MAX_PAYLOAD_BYTES) {
    return failure(
      "PAYLOAD_TOO_LARGE",
      `Charge de ${String(size)} octets, limite ${String(MAX_PAYLOAD_BYTES)}`
    );
  }
  const contract = IPC_CONTRACT[channel];
  const parsedRequest = validate(contract.request, payload, "INVALID_REQUEST");
  if (!parsedRequest.ok) return parsedRequest;
  let produced;
  try {
    produced = await invokeBackend(channel, parsedRequest.value, backend);
  } catch (error) {
    if (error instanceof IpcBackendError) return failure(error.code, error.message);
    return failure("INTERNAL_ERROR", describeError(error));
  }
  const parsedResponse = validate(contract.response, produced, "INVALID_RESPONSE");
  if (!parsedResponse.ok) return parsedResponse;
  return success(parsedResponse.value);
}
function registerIpcHandlers(registrar, backend) {
  for (const channel of Object.values(IPC_CHANNELS)) {
    registrar.removeHandler(channel);
    registrar.handle(channel, (_event, payload) => dispatchIpcRequest(channel, payload, backend));
  }
}
const MAX_TIMESTAMP_MS = 281474976710655;
const COUNTER_MAX = 4095;
function toHex(bytes) {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}
function format(bytes) {
  const hex = toHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join("-");
}
function composeUuidV7(timestampMs, counter, randomTail) {
  if (!Number.isInteger(timestampMs) || timestampMs < 0 || timestampMs > MAX_TIMESTAMP_MS) {
    throw new RangeError(`Timestamp outside UUID v7 48-bit range: ${String(timestampMs)}`);
  }
  if (!Number.isInteger(counter) || counter < 0 || counter > COUNTER_MAX) {
    throw new RangeError(`Counter outside rand_a 12-bit range: ${String(counter)}`);
  }
  if (randomTail.length !== 8) {
    throw new RangeError(`Expected 8 random bytes, got ${String(randomTail.length)}`);
  }
  const bytes = new Uint8Array(16);
  bytes[0] = Math.floor(timestampMs / 2 ** 40) & 255;
  bytes[1] = Math.floor(timestampMs / 2 ** 32) & 255;
  bytes[2] = Math.floor(timestampMs / 2 ** 24) & 255;
  bytes[3] = Math.floor(timestampMs / 2 ** 16) & 255;
  bytes[4] = Math.floor(timestampMs / 2 ** 8) & 255;
  bytes[5] = timestampMs & 255;
  bytes[6] = 112 | counter >>> 8 & 15;
  bytes[7] = counter & 255;
  bytes[8] = 128 | (randomTail[0] ?? 0) & 63;
  for (let index = 1; index < 8; index += 1) {
    bytes[8 + index] = randomTail[index] ?? 0;
  }
  return format(bytes);
}
function createUuidV7Generator(sources) {
  let lastTimestampMs = -1;
  let counter = 0;
  return {
    next() {
      let timestampMs = Math.floor(sources.now());
      if (timestampMs > lastTimestampMs) {
        lastTimestampMs = timestampMs;
        counter = 0;
      } else {
        timestampMs = lastTimestampMs;
        counter += 1;
        if (counter > COUNTER_MAX) {
          lastTimestampMs += 1;
          timestampMs = lastTimestampMs;
          counter = 0;
        }
      }
      return composeUuidV7(timestampMs, counter, sources.randomBytes(8));
    }
  };
}
const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function isUuidV7(candidate) {
  return UUID_V7_PATTERN.test(candidate);
}
const migrationProbeEntries = {
  version: 1,
  name: "create-probe-entries",
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
  }
};
const migrationFoundation = {
  version: 2,
  name: "create-foundation-schema",
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
  }
};
const migrationCatalogSearch = {
  version: 3,
  name: "catalog-search-normalized",
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
  }
};
const MIGRATIONS = [
  migrationProbeEntries,
  migrationFoundation,
  migrationCatalogSearch
];
MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0
);
const CREATE_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER NOT NULL PRIMARY KEY,
    name       TEXT    NOT NULL,
    applied_at TEXT    NOT NULL
  );
`;
function pendingMigrations(currentVersion) {
  return MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
    (left, right) => left.version - right.version
  );
}
function migrationsToRevert(currentVersion, targetVersion) {
  if (targetVersion >= currentVersion) return [];
  return MIGRATIONS.filter(
    (migration) => migration.version > targetVersion && migration.version <= currentVersion
  ).sort((left, right) => right.version - left.version);
}
const PLAINTEXT_SQLITE_HEADER = `SQLite format 3${String.fromCharCode(0)}`;
const DEFAULT_CIPHER = "sqlcipher";
class UnencryptedDatabaseError extends Error {
  constructor(filePath) {
    super(
      `File ${filePath} is a plaintext SQLite database. Refusing to open: the local database must be encrypted at rest (NFR8).`
    );
    this.filePath = filePath;
    this.name = "UnencryptedDatabaseError";
  }
  filePath;
}
class InvalidEncryptionKeyError extends Error {
  constructor(filePath) {
    super(
      `Cannot decrypt ${filePath}: wrong encryption key, or unreadable file.`
    );
    this.filePath = filePath;
    this.name = "InvalidEncryptionKeyError";
  }
  filePath;
}
class DatabaseIntegrityError extends Error {
  constructor(details) {
    super(`Integrity check failed: ${details}`);
    this.details = details;
    this.name = "DatabaseIntegrityError";
  }
  details;
}
function assertFileIsNotPlaintextSqlite(filePath) {
  if (!node_fs.existsSync(filePath)) return;
  if (node_fs.statSync(filePath).size === 0) return;
  const header = node_fs.readFileSync(filePath).subarray(0, 16).toString("latin1");
  if (header === PLAINTEXT_SQLITE_HEADER) throw new UnencryptedDatabaseError(filePath);
}
function readSchemaVersion(connection) {
  const row = connection.prepare("SELECT MAX(version) AS version FROM schema_migrations").get();
  return row?.version ?? 0;
}
class EncryptedDatabase {
  constructor(connection, filePath, ids, now) {
    this.filePath = filePath;
    this.#connection = connection;
    this.#ids = ids;
    this.#now = now;
  }
  filePath;
  #connection;
  #ids;
  #now;
  #closed = false;
  static open(options) {
    assertFileIsNotPlaintextSqlite(options.filePath);
    node_fs.mkdirSync(node_path.dirname(options.filePath), { recursive: true });
    const connection = new SqliteDatabase(options.filePath);
    try {
      connection.pragma(`cipher='${options.cipher ?? DEFAULT_CIPHER}'`);
      connection.pragma(`key='${options.encryptionKey.replace(/'/g, "''")}'`);
      connection.prepare("SELECT count(*) AS n FROM sqlite_schema").get();
    } catch (error) {
      connection.close();
      if (error instanceof Error && /SQLITE_NOTADB|file is not a database/i.test(error.message)) {
        throw new InvalidEncryptionKeyError(options.filePath);
      }
      throw error;
    }
    connection.pragma("journal_mode = WAL");
    connection.pragma("synchronous = FULL");
    connection.pragma("foreign_keys = ON");
    connection.pragma("busy_timeout = 5000");
    const now = options.now ?? (() => Date.now());
    const randomBytes = options.randomBytes ?? ((size) => new Uint8Array(node_crypto.randomBytes(size)));
    const database = new EncryptedDatabase(
      connection,
      options.filePath,
      createUuidV7Generator({ now, randomBytes }),
      now
    );
    database.migrateUp();
    return database;
  }
  /** Package services need the raw connection; callers outside @tenu/db should not. */
  get connection() {
    return this.#connection;
  }
  get journalMode() {
    const rows = this.#connection.pragma("journal_mode");
    return rows[0]?.journal_mode ?? "unknown";
  }
  get synchronousMode() {
    const rows = this.#connection.pragma("synchronous");
    return rows[0]?.synchronous ?? -1;
  }
  get schemaVersion() {
    return readSchemaVersion(this.#connection);
  }
  get isClosed() {
    return this.#closed;
  }
  nextId() {
    return this.#ids.next();
  }
  nowMs() {
    return this.#now();
  }
  nowIso() {
    return new Date(this.#now()).toISOString();
  }
  migrateUp() {
    this.#connection.exec(CREATE_MIGRATIONS_TABLE_SQL);
    let applied = 0;
    for (const migration of pendingMigrations(readSchemaVersion(this.#connection))) {
      const run = this.#connection.transaction(() => {
        migration.up(this.#connection);
        this.#connection.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.name, new Date(this.#now()).toISOString());
      });
      run();
      applied += 1;
    }
    return applied;
  }
  migrateDown(targetVersion) {
    let reverted = 0;
    for (const migration of migrationsToRevert(readSchemaVersion(this.#connection), targetVersion)) {
      const run = this.#connection.transaction(() => {
        migration.down(this.#connection);
        this.#connection.prepare("DELETE FROM schema_migrations WHERE version = ?").run(migration.version);
      });
      run();
      reverted += 1;
    }
    return reverted;
  }
  insertProbeEntry(label) {
    const entry = {
      id: this.#ids.next(),
      label,
      sequence: this.countProbeEntries() + 1,
      recordedAt: new Date(this.#now()).toISOString()
    };
    this.#connection.prepare("INSERT INTO probe_entries (id, label, sequence, recorded_at) VALUES (?, ?, ?, ?)").run(entry.id, entry.label, entry.sequence, entry.recordedAt);
    return entry;
  }
  insertProbeBatch(labelPrefix, count) {
    const run = this.#connection.transaction((total) => {
      for (let index = 0; index < total; index += 1) {
        this.insertProbeEntry(`${labelPrefix}-${String(index)}`);
      }
    });
    run(count);
    return count;
  }
  countProbeEntries() {
    const row = this.#connection.prepare("SELECT count(*) AS n FROM probe_entries").get();
    return row?.n ?? 0;
  }
  listProbeEntries() {
    const rows = this.#connection.prepare("SELECT id, label, sequence, recorded_at FROM probe_entries ORDER BY sequence").all();
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      sequence: row.sequence,
      recordedAt: row.recorded_at
    }));
  }
  assertIntegrity() {
    const verdict = this.integrityCheck();
    if (verdict !== "ok") throw new DatabaseIntegrityError(verdict);
  }
  integrityCheck() {
    const rows = this.#connection.pragma("integrity_check");
    return rows[0]?.integrity_check ?? "unknown";
  }
  transaction(work) {
    return this.#connection.transaction(work)();
  }
  close() {
    if (this.#closed) return;
    this.#connection.pragma("wal_checkpoint(TRUNCATE)");
    this.#connection.close();
    this.#closed = true;
  }
}
function openEncryptedDatabase(options) {
  return EncryptedDatabase.open(options);
}
const ENCRYPTION_KEY_ENV_VAR = "TENU_DATABASE_KEY";
const ENVIRONMENT_ENV_VAR = "TENU_ENV";
const DEVELOPMENT_FALLBACK_KEY = "cle-de-developpement-non-secrete";
class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      `Missing encryption key: environment variable ${ENCRYPTION_KEY_ENV_VAR} is required in production. No fallback is allowed outside development (NFR8).`
    );
    this.name = "MissingEncryptionKeyError";
  }
}
function isProductionEnvironment(env) {
  return env[ENVIRONMENT_ENV_VAR] === "production";
}
function resolveEncryptionKey(env) {
  const fromEnvironment = env[ENCRYPTION_KEY_ENV_VAR];
  if (typeof fromEnvironment === "string" && fromEnvironment.length > 0) {
    return { key: fromEnvironment, source: "environment" };
  }
  if (isProductionEnvironment(env)) throw new MissingEncryptionKeyError();
  return { key: DEVELOPMENT_FALLBACK_KEY, source: "development-fallback" };
}
const BASE_UNIT_CONVERSION_FACTOR = 1e3;
const MIN_PIN_ITERATIONS = 31e4;
class TenantIsolationError extends Error {
  constructor(expectedTenantId, actualTenantId) {
    super(
      `Tenant isolation violation: expected ${expectedTenantId}, got ${actualTenantId} [BR1.5]`
    );
    this.expectedTenantId = expectedTenantId;
    this.actualTenantId = actualTenantId;
    this.name = "TenantIsolationError";
  }
  expectedTenantId;
  actualTenantId;
}
class MissingOutboxError extends Error {
  constructor() {
    super("Business mutation requires an OutboxEvent in the same transaction [BR4.2]");
    this.name = "MissingOutboxError";
  }
}
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}
const PIN_PATTERN = /^\d{4,6}$/;
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 32;
function assertValidPin(pin) {
  if (!PIN_PATTERN.test(pin)) {
    throw new ValidationError("PIN must be 4 to 6 digits [BR2.1]");
  }
}
function derivePinHash(pin, salt, iterations = MIN_PIN_ITERATIONS) {
  assertValidPin(pin);
  if (iterations < MIN_PIN_ITERATIONS) {
    throw new ValidationError(`PIN iterations must be >= ${String(MIN_PIN_ITERATIONS)} [BR2.1]`);
  }
  return node_crypto.pbkdf2Sync(pin, salt, iterations, DERIVED_KEY_BYTES, "sha256");
}
function createPinMaterial(pin, iterations = MIN_PIN_ITERATIONS) {
  const salt = node_crypto.randomBytes(SALT_BYTES);
  const hash = derivePinHash(pin, salt, iterations);
  return {
    pinHash: hash.toString("hex"),
    pinSalt: salt.toString("hex"),
    pinIterations: iterations
  };
}
function asArray(value) {
  return Array.isArray(value) ? value : [value];
}
function nextLocalSequence(db, tenantId) {
  const row = db.connection.prepare("SELECT MAX(local_sequence) AS max_seq FROM outbox WHERE tenant_id = ?").get(tenantId);
  return (row?.max_seq ?? 0) + 1;
}
function insertAudit(db, context, draft) {
  if (!isUuidV7(draft.entityId)) {
    throw new Error(`entityId must be UUID v7: ${draft.entityId}`);
  }
  const id = db.nextId();
  db.connection.prepare(
    `INSERT INTO audit_log (
        id, tenant_id, user_id, session_id, action, entity_kind, entity_id,
        before_json, after_json, device_id, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    context.tenantId,
    context.actorUserId,
    draft.sessionId ?? null,
    draft.action,
    draft.entityKind,
    draft.entityId,
    draft.before === void 0 ? null : JSON.stringify(draft.before),
    draft.after === void 0 ? null : JSON.stringify(draft.after),
    context.deviceId,
    db.nowIso()
  );
  return id;
}
function insertOutbox(db, context, draft, localSequence) {
  const id = db.nextId();
  db.connection.prepare(
    `INSERT INTO outbox (
        id, tenant_id, event_kind, entity_id, payload, created_at, local_sequence
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    context.tenantId,
    draft.eventKind,
    draft.entityId,
    JSON.stringify(draft.payload),
    db.nowIso(),
    localSequence
  );
  return id;
}
class TransactionalWriter {
  constructor(db) {
    this.db = db;
  }
  db;
  /**
   * Atomically applies a business mutation with audit + outbox.
   * Passing `outbox: null` is refused — use Identity.recordPinAttempt for R-03.
   */
  commit(input) {
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
      const auditIds = [];
      for (const draft of audits) {
        auditIds.push(insertAudit(this.db, input.context, draft));
      }
      const outboxIds = [];
      const localSequences = [];
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
function assertTenantMatch(expectedTenantId, actualTenantId) {
  if (expectedTenantId !== actualTenantId) {
    throw new TenantIsolationError(expectedTenantId, actualTenantId);
  }
}
zod.z.number().int().min(0).max(1e4);
zod.z.literal("FCFA");
zod.z.enum(["none", "nearest_5", "nearest_10"]);
zod.z.array(zod.z.enum(["cash", "mobile_money", "card"])).min(1);
zod.z.string().min(1);
const DOCUMENTED_SETTING_DEFAULTS = {
  tva_rate_bps: 1925,
  currency: "FCFA",
  rounding_mode: "none",
  payment_modes: ["cash", "mobile_money"],
  receipt_mentions: "Merci de votre achat"
};
const SENSITIVE_PRODUCT_FIELDS = [
  "averagePurchaseCost",
  "cump",
  "margin",
  "cumulativeRevenue",
  "valuation"
];
const SENSITIVE_FIELD_SET = new Set(SENSITIVE_PRODUCT_FIELDS);
function maskProductForRole(product, role) {
  if (role !== "vendeur") {
    return product;
  }
  const safe = {};
  for (const [key, value] of Object.entries(product)) {
    if (!SENSITIVE_FIELD_SET.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}
function assertNoSensitiveFieldsForVendeur(projection, role) {
  if (role !== "vendeur") return;
  for (const field of SENSITIVE_PRODUCT_FIELDS) {
    if (field in projection && projection[field] !== void 0) {
      throw new Error(`Sensitive field leaked to vendeur: ${field} [BR5.1]`);
    }
  }
}
const FORBIDDEN_QTY_KEYS = /* @__PURE__ */ new Set([
  "quantity",
  "qty",
  "stockQuantity",
  "stock_qty",
  "quantite"
]);
function assertNoQuantityField(record) {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_QTY_KEYS.has(key)) {
      throw new ValidationError(`Product must not carry quantity field "${key}" [BR5.2]`);
    }
  }
}
function validateProductPrices(floorPrice, referencePrice) {
  if (!Number.isInteger(floorPrice) || floorPrice < 0) {
    throw new ValidationError("floorPrice must be a non-negative integer [DEC-04]");
  }
  if (!Number.isInteger(referencePrice) || referencePrice < 0) {
    throw new ValidationError("referencePrice must be a non-negative integer [DEC-04]");
  }
  if (floorPrice > referencePrice) {
    throw new ValidationError("floorPrice must be <= referencePrice [BR5.3]");
  }
}
function validateSellingUnit(unit) {
  if (!isUuidV7(unit.id) || !isUuidV7(unit.productId) || !isUuidV7(unit.tenantId)) {
    throw new ValidationError("SellingUnit ids must be UUID v7 [BR1.4]");
  }
  if (!Number.isInteger(unit.conversionFactor) || unit.conversionFactor < 1) {
    throw new ValidationError("conversionFactor must be integer >= 1 [BR5.3]");
  }
  if (!Number.isInteger(unit.price) || unit.price < 0) {
    throw new ValidationError("price must be a non-negative integer [DEC-04]");
  }
  if (!Number.isInteger(unit.floorPrice) || unit.floorPrice < 0) {
    throw new ValidationError("floorPrice must be a non-negative integer [DEC-04]");
  }
  if (unit.floorPrice > unit.price) {
    throw new ValidationError("SellingUnit floorPrice must be <= price [BR5.3]");
  }
}
function assertHasBaseSellingUnit(units) {
  const hasBase = units.some((unit) => unit.conversionFactor === BASE_UNIT_CONVERSION_FACTOR);
  if (!hasBase) {
    throw new ValidationError(
      `At least one SellingUnit must have conversionFactor=${String(BASE_UNIT_CONVERSION_FACTOR)} [BR5.3]`
    );
  }
}
function insertProductRow(db, product, createdAt) {
  assertNoQuantityField(product);
  validateProductPrices(product.floorPrice, product.referencePrice);
  if (!isUuidV7(product.id)) throw new ValidationError("Product id must be UUID v7 [BR1.4]");
  const searchNormalized = product.searchNormalized ?? [product.name, ...product.altNames ?? [], product.internalCode, product.barcode ?? ""].filter((part) => part.length > 0).join(" ").toLocaleLowerCase("fr-FR");
  db.connection.prepare(
    `INSERT INTO products (
        id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
        average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
        location, active, search_normalized, created_at, created_by, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    product.id,
    product.tenantId,
    product.internalCode,
    product.barcode ?? null,
    product.name,
    product.altNames === void 0 ? null : JSON.stringify(product.altNames),
    product.categoryId ?? null,
    product.baseUnit,
    product.averagePurchaseCost ?? null,
    product.referencePrice,
    product.floorPrice,
    product.stockAlertThreshold ?? null,
    product.location ?? null,
    product.active === false ? 0 : 1,
    searchNormalized,
    createdAt,
    product.createdBy,
    product.deviceId
  );
}
function insertSellingUnitRow(db, unit, createdAt) {
  validateSellingUnit(unit);
  db.connection.prepare(
    `INSERT INTO selling_units (
        id, tenant_id, product_id, label, conversion_factor, price, floor_price,
        created_at, created_by, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    unit.id,
    unit.tenantId,
    unit.productId,
    unit.label,
    unit.conversionFactor,
    unit.price,
    unit.floorPrice,
    createdAt,
    unit.createdBy,
    unit.deviceId
  );
}
function ok(value) {
  return { ok: true, value };
}
function err(error) {
  return { ok: false, error };
}
const ACCENT_MAP = {
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  æ: "ae",
  œ: "oe"
};
function normalizeSearchText(input) {
  const lower = input.trim().toLocaleLowerCase("fr-FR");
  let out = "";
  for (const char of lower) {
    out += ACCENT_MAP[char] ?? char;
  }
  return out;
}
function buildSearchNormalized(haystack) {
  const parts = [
    haystack.name,
    ...haystack.altNames,
    haystack.internalCode,
    haystack.barcode ?? ""
  ];
  return normalizeSearchText(parts.filter((part) => part.length > 0).join(" "));
}
function generateInternalCode(existing) {
  let sequence = existing.size + 1;
  for (; ; ) {
    const candidate = `SKU-${String(sequence).padStart(4, "0")}`;
    if (!existing.has(candidate)) return candidate;
    sequence += 1;
  }
}
function resolveInternalCode(provided, existing) {
  const trimmed = provided?.trim() ?? "";
  if (trimmed.length === 0) {
    return ok(generateInternalCode(existing));
  }
  if (existing.has(trimmed)) {
    return err({ code: "INTERNAL_CODE_COLLISION", field: "internalCode" });
  }
  return ok(trimmed);
}
const BASE_SELLING_UNIT_FACTOR_MILLI = 1e3;
function isNonNegativeIntegerMoney(value) {
  return Number.isInteger(value) && value >= 0;
}
function validateFloorVsReference(floorPrice, referencePrice) {
  if (!isNonNegativeIntegerMoney(floorPrice) || !isNonNegativeIntegerMoney(referencePrice)) {
    return err({ code: "INVALID_MONEY", field: "floorPrice" });
  }
  if (floorPrice > referencePrice) {
    return err({ code: "FLOOR_ABOVE_REFERENCE", field: "floorPrice" });
  }
  return ok(true);
}
function validateMinimalProductCreate(input) {
  const designation = input.designation.trim();
  if (designation.length === 0) {
    return err({ code: "MISSING_DESIGNATION", field: "designation" });
  }
  const baseUnit = input.baseUnit.trim();
  if (baseUnit.length === 0) {
    return err({ code: "MISSING_BASE_UNIT", field: "baseUnit" });
  }
  const prices = validateFloorVsReference(input.floorPrice, input.referencePrice);
  if (!prices.ok) return prices;
  return ok({
    designation,
    baseUnit,
    referencePrice: input.referencePrice,
    floorPrice: input.floorPrice
  });
}
function buildBaseSellingUnit(product) {
  return {
    label: product.baseUnit,
    conversionFactorMilli: BASE_SELLING_UNIT_FACTOR_MILLI,
    price: product.referencePrice,
    floorPrice: product.floorPrice
  };
}
function parseAltNames(raw) {
  if (raw === null || raw.length === 0) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}
function rowToRecord(row) {
  return {
    id: row.id,
    internalCode: row.internal_code,
    name: row.name,
    barcode: row.barcode,
    altNames: parseAltNames(row.alt_names),
    categoryId: row.category_id,
    baseUnit: row.base_unit,
    averagePurchaseCost: row.average_purchase_cost,
    referencePrice: row.reference_price,
    floorPrice: row.floor_price,
    stockAlertThreshold: row.stock_alert_threshold,
    location: row.location,
    active: row.active === 1
  };
}
function projectForRole(record, role) {
  const projection = {
    id: record.id,
    name: record.name,
    referencePrice: record.referencePrice,
    floorPrice: record.floorPrice,
    averagePurchaseCost: record.averagePurchaseCost
  };
  const masked = maskProductForRole(projection, role);
  assertNoSensitiveFieldsForVendeur({ ...masked }, role);
  if (role === "vendeur") {
    return {
      id: record.id,
      internalCode: record.internalCode,
      name: record.name,
      barcode: record.barcode,
      altNames: record.altNames,
      categoryId: record.categoryId,
      baseUnit: record.baseUnit,
      referencePrice: record.referencePrice,
      floorPrice: record.floorPrice,
      stockAlertThreshold: record.stockAlertThreshold,
      location: record.location,
      active: record.active
    };
  }
  return record;
}
class CatalogService {
  constructor(db, writer) {
    this.db = db;
    this.writer = writer;
  }
  db;
  writer;
  listInternalCodes(tenantId) {
    const rows = this.db.connection.prepare(
      "SELECT internal_code FROM products WHERE tenant_id = ?"
    ).all(tenantId);
    return new Set(rows.map((row) => row.internal_code));
  }
  searchProducts(tenantId, query, limit, role) {
    const needle = normalizeSearchText(query);
    if (needle.length === 0 || limit < 1) return [];
    const rows = this.db.connection.prepare(
      `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products
         WHERE tenant_id = ?
           AND active = 1
           AND search_normalized LIKE '%' || ? || '%'
         ORDER BY name
         LIMIT ?`
    ).all(tenantId, needle, limit);
    return rows.map((row) => {
      const record = rowToRecord(row);
      const projected = projectForRole(record, role);
      return {
        id: projected.id,
        internalCode: projected.internalCode,
        name: projected.name,
        referencePrice: projected.referencePrice,
        floorPrice: projected.floorPrice,
        active: projected.active
      };
    });
  }
  getProduct(tenantId, productId, role) {
    const row = this.db.connection.prepare(
      `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products
         WHERE id = ? AND tenant_id = ?`
    ).get(productId, tenantId);
    if (row === void 0) return null;
    assertTenantMatch(tenantId, row.tenant_id);
    return projectForRole(rowToRecord(row), role);
  }
  saveProduct(context, mode, fields) {
    const validated = validateMinimalProductCreate({
      designation: fields.designation,
      baseUnit: fields.baseUnit,
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice,
      ...fields.internalCode !== void 0 ? { internalCode: fields.internalCode } : {}
    });
    if (!validated.ok) {
      throw new ValidationError(`${validated.error.code} [BR3.9]`);
    }
    if (mode === "create") {
      return this.createProduct(context, fields, validated.value.designation);
    }
    return this.updateProduct(context, fields, validated.value.designation);
  }
  createProduct(context, fields, designation) {
    const existing = this.listInternalCodes(context.tenantId);
    const codeResult = resolveInternalCode(fields.internalCode, existing);
    if (!codeResult.ok) {
      throw new ValidationError(`${codeResult.error.code} [BR3.1]`);
    }
    const internalCode = codeResult.value;
    const productId = this.db.nextId();
    if (!isUuidV7(productId)) {
      throw new ValidationError("Product id must be UUID v7 [BR1.4]");
    }
    const baseUnit = buildBaseSellingUnit({
      baseUnit: fields.baseUnit.trim(),
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice
    });
    const sellingUnitId = this.db.nextId();
    const unit = {
      id: sellingUnitId,
      tenantId: context.tenantId,
      productId,
      label: baseUnit.label,
      conversionFactor: baseUnit.conversionFactorMilli,
      price: baseUnit.price,
      floorPrice: baseUnit.floorPrice,
      createdBy: context.actorUserId,
      deviceId: context.deviceId
    };
    assertHasBaseSellingUnit([unit]);
    if (unit.conversionFactor !== BASE_SELLING_UNIT_FACTOR_MILLI) {
      throw new ValidationError("Base selling unit factor mismatch [BR3.3]");
    }
    const altNames = fields.altNames ?? [];
    const searchNormalized = buildSearchNormalized({
      name: designation,
      altNames,
      internalCode,
      barcode: fields.barcode
    });
    const product = {
      id: productId,
      tenantId: context.tenantId,
      internalCode,
      name: designation,
      baseUnit: fields.baseUnit.trim(),
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice,
      createdBy: context.actorUserId,
      deviceId: context.deviceId,
      searchNormalized,
      ...fields.barcode !== void 0 ? { barcode: fields.barcode } : {},
      ...altNames.length > 0 ? { altNames } : {},
      ...fields.categoryId !== void 0 ? { categoryId: fields.categoryId } : {},
      ...fields.location !== void 0 ? { location: fields.location } : {},
      ...fields.averagePurchaseCost !== void 0 ? { averagePurchaseCost: fields.averagePurchaseCost } : {},
      ...fields.stockAlertThreshold !== void 0 ? { stockAlertThreshold: fields.stockAlertThreshold } : {}
    };
    this.writer.commit({
      context,
      apply: () => {
        insertProductRow(this.db, product, this.db.nowIso());
        insertSellingUnitRow(this.db, unit, this.db.nowIso());
      },
      audit: {
        action: "PRODUCT_CREATED",
        entityKind: "product",
        entityId: productId,
        after: { internalCode, name: designation }
      },
      outbox: {
        eventKind: "product.created",
        entityId: productId,
        payload: { productId, internalCode }
      }
    });
    return { productId, internalCode };
  }
  updateProduct(context, fields, designation) {
    const productId = fields.productId;
    if (productId === void 0 || !isUuidV7(productId)) {
      throw new ValidationError("productId required for update [BR3.9]");
    }
    const existing = this.db.connection.prepare(
      `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products WHERE id = ? AND tenant_id = ?`
    ).get(productId, context.tenantId);
    if (existing === void 0) {
      throw new ValidationError(`Product not found: ${productId}`);
    }
    assertTenantMatch(context.tenantId, existing.tenant_id);
    const internalCode = fields.internalCode?.trim() ?? existing.internal_code;
    if (internalCode !== existing.internal_code) {
      const codes = new Set(this.listInternalCodes(context.tenantId));
      codes.delete(existing.internal_code);
      const codeResult = resolveInternalCode(internalCode, codes);
      if (!codeResult.ok) {
        throw new ValidationError(`${codeResult.error.code} [BR3.1]`);
      }
    }
    const altNames = fields.altNames ?? parseAltNames(existing.alt_names);
    const barcode = fields.barcode ?? existing.barcode ?? void 0;
    const searchNormalized = buildSearchNormalized({
      name: designation,
      altNames,
      internalCode,
      barcode,
      active: existing.active === 1
    });
    this.writer.commit({
      context,
      apply: () => {
        this.db.connection.prepare(
          `UPDATE products SET
              internal_code = ?, barcode = ?, name = ?, alt_names = ?, category_id = ?,
              base_unit = ?, average_purchase_cost = ?, reference_price = ?, floor_price = ?,
              stock_alert_threshold = ?, location = ?, search_normalized = ?
             WHERE id = ? AND tenant_id = ?`
        ).run(
          internalCode,
          barcode ?? null,
          designation,
          altNames.length === 0 ? null : JSON.stringify(altNames),
          fields.categoryId ?? existing.category_id,
          fields.baseUnit.trim(),
          fields.averagePurchaseCost ?? existing.average_purchase_cost,
          fields.referencePrice,
          fields.floorPrice,
          fields.stockAlertThreshold ?? existing.stock_alert_threshold,
          fields.location ?? existing.location,
          searchNormalized,
          productId,
          context.tenantId
        );
        this.db.connection.prepare(
          `UPDATE selling_units SET label = ?, price = ?, floor_price = ?
             WHERE product_id = ? AND tenant_id = ? AND conversion_factor = ?`
        ).run(
          fields.baseUnit.trim(),
          fields.referencePrice,
          fields.floorPrice,
          productId,
          context.tenantId,
          BASE_SELLING_UNIT_FACTOR_MILLI
        );
      },
      audit: {
        action: "PRODUCT_UPDATED",
        entityKind: "product",
        entityId: productId,
        before: { name: existing.name, referencePrice: existing.reference_price },
        after: { name: designation, referencePrice: fields.referencePrice }
      },
      outbox: {
        eventKind: "product.updated",
        entityId: productId,
        payload: { productId, internalCode }
      }
    });
    return { productId, internalCode };
  }
}
const DEMO_PRODUCT_COUNT = 200;
const DEMO_DEVICE_ID = "demo-device-seed";
function demoShopNoun() {
  return String.fromCharCode(113, 117, 105, 110, 99, 97, 105, 108, 108, 101, 114, 105, 101);
}
const CATEGORY_SUFFIXES = [
  "generale",
  "Outillage",
  "Plomberie",
  "Electricite",
  "Peinture",
  "Fixations"
];
function insertTenant(db, id, name) {
  db.connection.prepare("INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)").run(id, name, db.nowIso());
}
function insertStore(db, input) {
  db.connection.prepare(
    `INSERT INTO stores (id, tenant_id, name, created_at, created_by, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`
  ).run(input.id, input.tenantId, input.name, db.nowIso(), input.createdBy, DEMO_DEVICE_ID);
}
function insertUser(db, input) {
  const material = createPinMaterial(input.pin);
  db.connection.prepare(
    `INSERT INTO users (
        id, tenant_id, name, phone, pin_hash, pin_salt, pin_iterations,
        role, allowed_store_ids, active, last_activity_at, created_at, created_by, device_id
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?)`
  ).run(
    input.id,
    input.tenantId,
    input.name,
    material.pinHash,
    material.pinSalt,
    material.pinIterations,
    input.role,
    JSON.stringify([input.storeId]),
    db.nowIso(),
    input.createdBy,
    DEMO_DEVICE_ID
  );
}
function insertSetting(db, input) {
  db.connection.prepare(
    `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`
  ).run(
    input.id,
    input.tenantId,
    input.key,
    JSON.stringify(input.value),
    db.nowIso(),
    input.createdBy,
    DEMO_DEVICE_ID
  );
}
function seedDemoDatabase(db) {
  const tenantId = db.nextId();
  const storeId = db.nextId();
  const proprietaireId = db.nextId();
  const gerantId = db.nextId();
  const vendeurId = db.nextId();
  const shopNoun = demoShopNoun();
  return db.transaction(() => {
    insertTenant(db, tenantId, `Demo ${shopNoun}`);
    insertStore(db, {
      id: storeId,
      tenantId,
      name: `Magasin ${shopNoun}`,
      createdBy: proprietaireId
    });
    insertUser(db, {
      id: proprietaireId,
      tenantId,
      name: "Alice Proprietaire",
      pin: "1234",
      role: "proprietaire",
      storeId,
      createdBy: proprietaireId
    });
    insertUser(db, {
      id: gerantId,
      tenantId,
      name: "Bob Gerant",
      pin: "2345",
      role: "gerant",
      storeId,
      createdBy: proprietaireId
    });
    insertUser(db, {
      id: vendeurId,
      tenantId,
      name: "Carla Vendeur",
      pin: "3456",
      role: "vendeur",
      storeId,
      createdBy: proprietaireId
    });
    for (const [key, value] of Object.entries(DOCUMENTED_SETTING_DEFAULTS)) {
      insertSetting(db, {
        id: db.nextId(),
        tenantId,
        key,
        value,
        createdBy: proprietaireId
      });
    }
    const categoryIds = CATEGORY_SUFFIXES.map((suffix, index) => {
      const id = db.nextId();
      const label = index === 0 ? `${shopNoun} ${suffix}` : suffix;
      db.connection.prepare(
        `INSERT INTO categories (id, tenant_id, name, parent_id, created_at, created_by, device_id)
           VALUES (?, ?, ?, NULL, ?, ?, ?)`
      ).run(id, tenantId, label, db.nowIso(), proprietaireId, DEMO_DEVICE_ID);
      return id;
    });
    let sellingUnitCount = 0;
    for (let index = 1; index <= DEMO_PRODUCT_COUNT; index += 1) {
      const productId = db.nextId();
      const referencePrice = 500 + index * 25;
      const floorPrice = Math.floor(referencePrice * 0.9);
      const categoryId = categoryIds[(index - 1) % categoryIds.length];
      if (categoryId === void 0) throw new Error("category missing");
      const productName = index === 1 ? "Écrou hexagonal demo" : `Article demo ${String(index)}`;
      const internalCode = `SKU-${String(index).padStart(4, "0")}`;
      insertProductRow(
        db,
        {
          id: productId,
          tenantId,
          internalCode,
          name: productName,
          baseUnit: "piece",
          averagePurchaseCost: referencePrice * 800,
          referencePrice,
          floorPrice,
          categoryId,
          createdBy: proprietaireId,
          deviceId: DEMO_DEVICE_ID,
          searchNormalized: buildSearchNormalized({
            name: productName,
            altNames: [],
            internalCode
          })
        },
        db.nowIso()
      );
      insertSellingUnitRow(
        db,
        {
          id: db.nextId(),
          tenantId,
          productId,
          label: "piece",
          conversionFactor: BASE_UNIT_CONVERSION_FACTOR,
          price: referencePrice,
          floorPrice,
          createdBy: proprietaireId,
          deviceId: DEMO_DEVICE_ID
        },
        db.nowIso()
      );
      sellingUnitCount += 1;
    }
    return {
      tenantId,
      storeId,
      userIds: {
        proprietaire: proprietaireId,
        gerant: gerantId,
        vendeur: vendeurId
      },
      productCount: DEMO_PRODUCT_COUNT,
      sellingUnitCount
    };
  });
}
class PreviewReceiptPrinter {
  target = "preview";
  description = "Aperçu à l'écran (aucun matériel requis)";
  #jobs = [];
  get jobs() {
    return this.#jobs;
  }
  get lastPreview() {
    return this.#jobs.at(-1)?.preview;
  }
  isAvailable() {
    return Promise.resolve(true);
  }
  print(job) {
    this.#jobs.push(job);
    return Promise.resolve();
  }
  clear() {
    this.#jobs.length = 0;
  }
}
class PrinterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PrinterError";
  }
  code;
}
const DEFAULT_PRINT_TIMEOUT_MS = 1e4;
async function printSafely(printer, job, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;
  const byteCount = job.bytes.length;
  let available;
  try {
    available = await printer.isAvailable();
  } catch (error) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: "PRINTER_UNAVAILABLE",
      reason: messageOf(error)
    };
  }
  if (!available) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: "PRINTER_UNAVAILABLE",
      reason: `Imprimante indisponible : ${printer.description}`
    };
  }
  let timer;
  const guard = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({
        printed: false,
        target: printer.target,
        byteCount,
        code: "PRINT_TIMEOUT",
        reason: `Aucune réponse de l'imprimante après ${String(timeoutMs)} ms`
      });
    }, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();
  });
  const attempt = (async () => {
    try {
      await printer.print(job);
      return { printed: true, target: printer.target, byteCount };
    } catch (error) {
      return {
        printed: false,
        target: printer.target,
        byteCount,
        code: error instanceof PrinterError ? error.code : "PRINTER_REFUSED",
        reason: messageOf(error)
      };
    }
  })();
  try {
    return await Promise.race([attempt, guard]);
  } finally {
    if (timer !== void 0) clearTimeout(timer);
  }
}
function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue";
}
const windowsSpoolerAccess = {
  stageBytes(bytes) {
    const directory = node_fs.mkdtempSync(node_path.join(node_os.tmpdir(), "tenu-print-"));
    const filePath = node_path.join(directory, "receipt.bin");
    node_fs.writeFileSync(filePath, bytes);
    return filePath;
  },
  sendRaw(filePath, shareName) {
    node_child_process.execFileSync("cmd", ["/c", "copy", "/b", filePath, shareName], { stdio: "ignore" });
  },
  discard(filePath) {
    try {
      node_fs.rmSync(filePath, { force: true });
    } catch {
    }
  }
};
class SpoolerReceiptPrinter {
  target = "spooler";
  description;
  #shareName;
  #access;
  constructor(options) {
    this.#shareName = options.shareName;
    this.#access = options.access ?? windowsSpoolerAccess;
    this.description = `File d'impression Windows ${options.shareName}`;
  }
  isAvailable() {
    return Promise.resolve(this.#shareName.length > 0);
  }
  print(job) {
    let stagedPath;
    try {
      stagedPath = this.#access.stageBytes(job.bytes);
      this.#access.sendRaw(stagedPath, this.#shareName);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new PrinterError(
        "PRINTER_REFUSED",
        `La file d'impression ${this.#shareName} a refusé le travail : ${message}`
      );
    } finally {
      if (stagedPath !== void 0) this.#access.discard(stagedPath);
    }
  }
}
const nodeUsbDeviceAccess = {
  exists(devicePath) {
    if (devicePath.startsWith("\\\\.\\") || /^COM\d+$/i.test(devicePath)) return true;
    return node_fs.existsSync(devicePath);
  },
  write(devicePath, bytes) {
    node_fs.writeFileSync(devicePath, bytes);
  }
};
class UsbReceiptPrinter {
  target = "usb";
  description;
  #devicePath;
  #access;
  constructor(options) {
    this.#devicePath = options.devicePath;
    this.#access = options.access ?? nodeUsbDeviceAccess;
    this.description = `Périphérique USB ${options.devicePath}`;
  }
  isAvailable() {
    try {
      return Promise.resolve(this.#access.exists(this.#devicePath));
    } catch {
      return Promise.resolve(false);
    }
  }
  print(job) {
    try {
      this.#access.write(this.#devicePath, job.bytes);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const interrupted = /EIO|ENXIO|ENODEV|EPIPE|EBUSY/.test(message);
      throw new PrinterError(
        interrupted ? "PRINT_INTERRUPTED" : "PRINTER_REFUSED",
        `Écriture sur ${this.#devicePath} impossible : ${message}`
      );
    }
  }
}
const USB_DEVICE_ENV_VAR = "TENU_PRINTER_DEVICE";
const SPOOLER_SHARE_ENV_VAR = "TENU_PRINTER_SHARE";
const DEFAULT_USB_DEVICE = "\\\\.\\USB001";
const DEFAULT_SPOOLER_SHARE = "\\\\localhost\\TICKET";
function createReceiptPrinter(target, env = process.env) {
  switch (target) {
    case "usb":
      return new UsbReceiptPrinter({ devicePath: env[USB_DEVICE_ENV_VAR] ?? DEFAULT_USB_DEVICE });
    case "spooler":
      return new SpoolerReceiptPrinter({
        shareName: env[SPOOLER_SHARE_ENV_VAR] ?? DEFAULT_SPOOLER_SHARE
      });
    case "preview":
      return new PreviewReceiptPrinter();
  }
}
const DISPLAY_TIME_ZONE = "Africa/Douala";
const CURRENCY_LABEL = "FCFA";
const GROUP_SEPARATOR = " ";
function formatAmountFcfa(amountFcfa) {
  if (!Number.isInteger(amountFcfa)) {
    throw new RangeError(
      `Montant non entier : ${String(amountFcfa)}. Les montants sont des entiers de FCFA (DEC-04).`
    );
  }
  const negative = amountFcfa < 0;
  const digits = Math.abs(amountFcfa).toString();
  let grouped = "";
  for (let index = 0; index < digits.length; index += 1) {
    const remaining = digits.length - index;
    const digit = digits[index] ?? "";
    grouped += digit;
    if (remaining > 1 && remaining % 3 === 1) grouped += GROUP_SEPARATOR;
  }
  return `${negative ? "-" : ""}${grouped}${GROUP_SEPARATOR}${CURRENCY_LABEL}`;
}
function pad2(value) {
  return value.toString().padStart(2, "0");
}
function doualaParts(instant) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = new Map(
    formatter.formatToParts(instant).map((part) => [part.type, part.value])
  );
  const read = (type) => parts.get(type) ?? "00";
  return {
    day: read("day"),
    month: read("month"),
    year: read("year"),
    // `Intl` rend parfois `24` pour minuit en `hour12: false`.
    hour: pad2(Number.parseInt(read("hour"), 10) % 24),
    minute: read("minute"),
    second: read("second")
  };
}
function formatDate(instant) {
  const parts = doualaParts(instant);
  return `${parts.day}/${parts.month}/${parts.year}`;
}
function formatDateTime(instant) {
  const parts = doualaParts(instant);
  return `${formatDate(instant)} ${parts.hour}:${parts.minute}:${parts.second}`;
}
const ESC = 27;
const GS = 29;
const LF = 10;
const COLUMNS_80MM = 48;
const ESCPOS_COMMANDS = {
  /** `ESC @` — réinitialise l'imprimante. */
  initialize: Uint8Array.from([ESC, 64]),
  /** `ESC t 16` — page de codes Windows-1252. */
  selectCodePageWindows1252: Uint8Array.from([ESC, 116, 16]),
  alignLeft: Uint8Array.from([ESC, 97, 0]),
  alignCenter: Uint8Array.from([ESC, 97, 1]),
  alignRight: Uint8Array.from([ESC, 97, 2]),
  boldOn: Uint8Array.from([ESC, 69, 1]),
  boldOff: Uint8Array.from([ESC, 69, 0]),
  /** `GS ! 0x11` — double hauteur et double largeur. */
  doubleSize: Uint8Array.from([GS, 33, 17]),
  normalSize: Uint8Array.from([GS, 33, 0]),
  /** `GS V 66 0` — coupe partielle après avance papier. */
  partialCut: Uint8Array.from([GS, 86, 66, 0]),
  lineFeed: Uint8Array.from([LF])
};
const CHARACTER_FALLBACKS = /* @__PURE__ */ new Map([
  [" ", " "],
  // espace insécable fine (séparateur de milliers)
  [" ", " "],
  // espace insécable
  ["’", "'"],
  ["‘", "'"],
  ["“", '"'],
  ["”", '"'],
  ["–", "-"],
  ["—", "-"],
  ["…", "..."]
]);
function encodeText(text) {
  let normalized = "";
  for (const character of text) {
    normalized += CHARACTER_FALLBACKS.get(character) ?? character;
  }
  const bytes = new Uint8Array(normalized.length);
  for (let index = 0; index < normalized.length; index += 1) {
    const codePoint = normalized.charCodeAt(index);
    bytes[index] = codePoint <= 255 ? codePoint : 63;
  }
  return bytes;
}
function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function textLine(text, options = {}) {
  const chunks = [];
  const align = options.align ?? "left";
  chunks.push(
    align === "center" ? ESCPOS_COMMANDS.alignCenter : align === "right" ? ESCPOS_COMMANDS.alignRight : ESCPOS_COMMANDS.alignLeft
  );
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOn);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.doubleSize);
  chunks.push(encodeText(text), ESCPOS_COMMANDS.lineFeed);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.normalSize);
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOff);
  return concatBytes(chunks);
}
function separatorLine(columns = COLUMNS_80MM, character = "-") {
  return textLine(character.repeat(Math.max(1, columns)));
}
function labelledValueLine(label, value, columns = COLUMNS_80MM) {
  const padding = columns - label.length - value.length;
  const text = padding >= 1 ? `${label}${" ".repeat(padding)}${value}` : `${label} ${value}`.slice(-columns);
  return textLine(text);
}
function feedAndCut(feedLines = 4) {
  const feed = [];
  for (let index = 0; index < feedLines; index += 1) feed.push(ESCPOS_COMMANDS.lineFeed);
  return concatBytes([...feed, ESCPOS_COMMANDS.partialCut]);
}
function documentHeader() {
  return concatBytes([
    ESCPOS_COMMANDS.initialize,
    ESCPOS_COMMANDS.selectCodePageWindows1252,
    ESCPOS_COMMANDS.alignLeft
  ]);
}
const TITLE = "TICKET D'ESSAI";
const SUBTITLE = "TenuXpector - preuve de concept";
const FOOTER = "Ce ticket ne vaut pas justificatif de vente.";
function composeProbeReceipt(content) {
  const columns = content.columns ?? COLUMNS_80MM;
  const amount = formatAmountFcfa(content.amountFcfa);
  const timestamp = formatDateTime(content.printedAt);
  const lines = [
    { bytes: textLine(TITLE, { align: "center", bold: true, doubleSize: true }), text: TITLE },
    { bytes: textLine(SUBTITLE, { align: "center" }), text: SUBTITLE },
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    { bytes: labelledValueLine("Date", timestamp, columns), text: padPair("Date", timestamp, columns) },
    { bytes: labelledValueLine("Libelle", content.label, columns), text: padPair("Libelle", content.label, columns) }
  ];
  if (content.entryId !== void 0) {
    lines.push({
      bytes: labelledValueLine("Reference", content.entryId, columns),
      text: padPair("Reference", content.entryId, columns)
    });
  }
  lines.push(
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    {
      bytes: labelledValueLine("Montant de demonstration", amount, columns),
      text: padPair("Montant de demonstration", amount, columns)
    },
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    { bytes: textLine(FOOTER, { align: "center" }), text: FOOTER }
  );
  const bytes = concatBytes([documentHeader(), ...lines.map((line) => line.bytes), feedAndCut()]);
  const preview = lines.map((line) => line.text).join("\n");
  return { bytes, preview };
}
function padPair(label, value, columns) {
  const padding = columns - label.length - value.length;
  return padding >= 1 ? `${label}${" ".repeat(padding)}${value}` : `${label} ${value}`.slice(-columns);
}
class ProbeApplication {
  #options;
  #now;
  #database;
  #demoSession = null;
  constructor(options) {
    this.#options = options;
    this.#now = options.now ?? (() => Date.now());
  }
  get database() {
    return this.#database;
  }
  #resolveDemoSession(database) {
    if (this.#demoSession !== null) return this.#demoSession;
    const tenant = database.connection.prepare("SELECT id FROM tenants ORDER BY created_at LIMIT 1").get();
    if (tenant === void 0) return null;
    const users = database.connection.prepare(
      "SELECT id, role FROM users WHERE tenant_id = ?"
    ).all(tenant.id);
    const proprietaireId = users.find((user) => user.role === "proprietaire")?.id;
    const gerantId = users.find((user) => user.role === "gerant")?.id;
    const vendeurId = users.find((user) => user.role === "vendeur")?.id;
    if (proprietaireId === void 0 || gerantId === void 0 || vendeurId === void 0) {
      return null;
    }
    this.#demoSession = {
      tenantId: tenant.id,
      proprietaireId,
      gerantId,
      vendeurId
    };
    return this.#demoSession;
  }
  openDatabase() {
    try {
      if (this.#database === void 0 || this.#database.isClosed) {
        const env = this.#options.env ?? process.env;
        const resolved = resolveEncryptionKey(env);
        const open = this.#options.openDatabase ?? openEncryptedDatabase;
        this.#database = open({
          filePath: this.#options.databasePath,
          encryptionKey: resolved.key,
          now: this.#now
        });
      }
      const database = this.#database;
      let demoSession = null;
      try {
        const tenantRow = database.connection.prepare("SELECT id FROM tenants LIMIT 1").get();
        if (tenantRow === void 0) {
          const seeded = seedDemoDatabase(database);
          this.#demoSession = {
            tenantId: seeded.tenantId,
            proprietaireId: seeded.userIds.proprietaire,
            gerantId: seeded.userIds.gerant,
            vendeurId: seeded.userIds.vendeur
          };
        }
        demoSession = this.#resolveDemoSession(database);
      } catch {
        demoSession = this.#demoSession;
      }
      return Promise.resolve({
        path: database.filePath,
        encrypted: true,
        journalMode: database.journalMode,
        schemaVersion: database.schemaVersion,
        demoSession
      });
    } catch (error) {
      if (error instanceof UnencryptedDatabaseError || error instanceof InvalidEncryptionKeyError) {
        return Promise.reject(new IpcBackendError("DATABASE_UNAVAILABLE", error.message));
      }
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  writeProbe(request) {
    const database = this.#database;
    if (database === void 0 || database.isClosed) {
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_UNAVAILABLE",
          "La base n'est pas ouverte. Ouvrez-la avant d'écrire."
        )
      );
    }
    try {
      const entry = database.insertProbeEntry(request.label);
      return Promise.resolve({
        id: entry.id,
        label: entry.label,
        recordedAt: entry.recordedAt,
        total: database.countProbeEntries()
      });
    } catch (error) {
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  async printProbe(request) {
    const composed = composeProbeReceipt({
      label: request.label,
      amountFcfa: request.amountFcfa,
      printedAt: new Date(this.#now())
    });
    const factory = this.#options.createPrinter ?? createReceiptPrinter;
    const printer = factory(request.target);
    const outcome = await printSafely(
      printer,
      { bytes: composed.bytes, preview: composed.preview },
      this.#options.printTimeoutMs === void 0 ? {} : { timeoutMs: this.#options.printTimeoutMs }
    );
    return {
      printed: outcome.printed,
      via: request.target,
      byteCount: outcome.byteCount,
      reason: outcome.printed ? null : outcome.reason,
      preview: composed.preview
    };
  }
  #requireCatalog() {
    const database = this.#database;
    if (database === void 0 || database.isClosed) {
      throw new IpcBackendError(
        "DATABASE_UNAVAILABLE",
        "La base n'est pas ouverte. Ouvrez-la avant le catalogue."
      );
    }
    return new CatalogService(database, new TransactionalWriter(database));
  }
  catalogSearch(request) {
    try {
      const catalog = this.#requireCatalog();
      const items = catalog.searchProducts(
        request.session.tenantId,
        request.query,
        request.limit,
        request.session.role
      );
      return Promise.resolve({ items: [...items] });
    } catch (error) {
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  catalogGetProduct(request) {
    try {
      const catalog = this.#requireCatalog();
      const product = catalog.getProduct(
        request.session.tenantId,
        request.productId,
        request.session.role
      );
      if (product === null) {
        return Promise.resolve({ product: null });
      }
      const view = {
        id: product.id,
        internalCode: product.internalCode,
        name: product.name,
        barcode: product.barcode,
        altNames: [...product.altNames],
        categoryId: product.categoryId,
        baseUnit: product.baseUnit,
        referencePrice: product.referencePrice,
        floorPrice: product.floorPrice,
        stockAlertThreshold: product.stockAlertThreshold,
        location: product.location,
        active: product.active
      };
      if ("averagePurchaseCost" in product) {
        return Promise.resolve({
          product: { ...view, averagePurchaseCost: product.averagePurchaseCost }
        });
      }
      return Promise.resolve({ product: view });
    } catch (error) {
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  catalogSaveProduct(request) {
    if (request.session.role === "vendeur") {
      return Promise.reject(
        new IpcBackendError("FORBIDDEN_ROLE", "Le vendeur ne peut pas enregistrer une fiche [BR3.17]")
      );
    }
    try {
      const catalog = this.#requireCatalog();
      const { fields } = request;
      const result = catalog.saveProduct(
        {
          tenantId: request.session.tenantId,
          actorUserId: request.session.actorUserId,
          deviceId: request.session.deviceId
        },
        request.mode,
        {
          designation: fields.designation,
          baseUnit: fields.baseUnit,
          referencePrice: fields.referencePrice,
          floorPrice: fields.floorPrice,
          internalCode: fields.internalCode,
          barcode: fields.barcode,
          altNames: fields.altNames,
          categoryId: fields.categoryId,
          location: fields.location,
          averagePurchaseCost: fields.averagePurchaseCost,
          stockAlertThreshold: fields.stockAlertThreshold,
          productId: fields.productId
        }
      );
      return Promise.resolve(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Promise.reject(new IpcBackendError("VALIDATION_FAILED", error.message));
      }
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  close() {
    this.#database?.close();
    this.#database = void 0;
  }
}
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "media-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join("; ");
function hardenedWebPreferences(options) {
  return {
    preload: options.preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    webviewTag: false,
    spellcheck: false
  };
}
function isNavigationAllowed(targetUrl, applicationUrl) {
  let target;
  let allowed;
  try {
    target = new URL(targetUrl);
    allowed = new URL(applicationUrl);
  } catch {
    return false;
  }
  if (target.protocol !== "file:") return false;
  if (allowed.protocol !== "file:") return false;
  return decodeURIComponent(target.pathname) === decodeURIComponent(allowed.pathname);
}
function applyNavigationPolicy(contents, applicationUrl, onDenied = () => void 0) {
  contents.on("will-navigate", (event, url) => {
    if (isNavigationAllowed(url, applicationUrl)) return;
    event.preventDefault();
    onDenied({ kind: "navigate", url });
  });
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
    onDenied({ kind: "webview", url: "" });
  });
  contents.setWindowOpenHandler((details) => {
    onDenied({ kind: "window-open", url: details.url });
    return { action: "deny" };
  });
}
function applySessionPolicy(session) {
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders ?? {} };
    const nextHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== "content-security-policy") {
        nextHeaders[key] = value;
      }
    }
    nextHeaders["Content-Security-Policy"] = [CONTENT_SECURITY_POLICY];
    callback({ responseHeaders: nextHeaders });
  });
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}
function resolveDatabasePath(userDataPath) {
  return node_path.join(userDataPath, "pc-proof", "probe.db");
}
function createMainWindow(deps) {
  const window = new electron.BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: hardenedWebPreferences({ preloadPath: deps.preloadPath })
  });
  window.once("ready-to-show", () => {
    window.show();
  });
  applySessionPolicy(electron.session.defaultSession);
  if (deps.isDev && deps.rendererUrl !== void 0) {
    void window.loadURL(deps.rendererUrl);
  } else {
    void window.loadFile(deps.rendererFilePath);
  }
  window.webContents.on("did-finish-load", () => {
    const applicationUrl = deps.rendererUrl ?? (typeof window.webContents.getURL === "function" ? window.webContents.getURL() : `file://${deps.rendererFilePath}`);
    applyNavigationPolicy(window.webContents, applicationUrl);
  });
  return window;
}
function startApplication(deps) {
  const probe = new ProbeApplication({ databasePath: resolveDatabasePath(deps.userDataPath) });
  registerIpcHandlers(electron.ipcMain, probe);
  const window = createMainWindow(deps);
  return { probe, window };
}
function stopApplication(running2) {
  running2?.probe.close();
  if (running2 !== void 0 && !running2.window.isDestroyed()) {
    running2.window.close();
  }
}
const isDev = !electron.app.isPackaged;
let running;
function resolveDeps() {
  return {
    userDataPath: electron.app.getPath("userData"),
    preloadPath: node_path.join(__dirname, "../preload/preload.cjs"),
    rendererUrl: process.env.ELECTRON_RENDERER_URL,
    rendererFilePath: node_path.join(__dirname, "../renderer/index.html"),
    isDev
  };
}
void electron.app.whenReady().then(() => {
  running = startApplication(resolveDeps());
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      running = startApplication(resolveDeps());
    }
  });
});
electron.app.on("window-all-closed", () => {
  stopApplication(running);
  running = void 0;
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("before-quit", () => {
  stopApplication(running);
  running = void 0;
});

/**
 * @tenu/db — U2 foundation public API.
 */
export {
  EncryptedDatabase,
  openEncryptedDatabase,
  UnencryptedDatabaseError,
  InvalidEncryptionKeyError,
  DatabaseIntegrityError,
  assertFileIsNotPlaintextSqlite,
  DEFAULT_CIPHER,
  LATEST_SCHEMA_VERSION,
  type OpenDatabaseOptions,
  type ProbeEntry,
  type SqliteConnection,
} from './encrypted-database';

export {
  DEVELOPMENT_FALLBACK_KEY,
  ENCRYPTION_KEY_ENV_VAR,
  ENVIRONMENT_ENV_VAR,
  MissingEncryptionKeyError,
  resolveEncryptionKey,
  describeEncryptionKey,
  isProductionEnvironment,
  type EncryptionKeySource,
  type ResolvedEncryptionKey,
} from './encryption-key';

export {
  composeUuidV7,
  createUuidV7Generator,
  isUuidV7,
  timestampOfUuidV7,
  type UuidV7Generator,
  type UuidV7Sources,
} from './uuid-v7';

export {
  MIGRATIONS,
  CREATE_MIGRATIONS_TABLE_SQL,
  pendingMigrations,
  migrationsToRevert,
  type Migration,
  type MigrationRunner,
} from './migrations';

export {
  USER_ROLES,
  BASE_UNIT_CONVERSION_FACTOR,
  MIN_PIN_ITERATIONS,
  PIN_LOCKOUT_FAILURES,
  PIN_LOCKOUT_WINDOW_MS,
  TenantIsolationError,
  AppendOnlyViolationError,
  MissingOutboxError,
  ValidationError,
  ok,
  err,
  type UserRole,
  type Result,
  type TenantContext,
} from './types';

export {
  assertValidPin,
  derivePinHash,
  createPinMaterial,
  verifyPinAgainstMaterial,
  type PinMaterial,
} from './identity/pin';

export {
  IdentityService,
  type CreateUserInput,
  type UserRecord,
  type PinAttemptRecord,
  type PinVerifyError,
} from './identity/identity-service';

export {
  SettingsService,
} from './settings/settings-service';

export {
  DOCUMENTED_SETTING_DEFAULTS,
  SETTING_KEYS,
  parseSettingValue,
  settingValueSchemas,
  type SettingKey,
  type SettingValueMap,
} from './settings/defaults';

export {
  TransactionalWriter,
  assertTenantMatch,
  type AuditDraft,
  type OutboxDraft,
  type CommitInput,
  type CommitResult,
} from './transactional-writer';

export {
  SENSITIVE_PRODUCT_FIELDS,
  maskProductForRole,
  assertNoSensitiveFieldsForVendeur,
  type ProductProjection,
  type SensitiveProductField,
} from './sensitive-data-guard';

export {
  assertNoQuantityField,
  validateProductPrices,
  validateSellingUnit,
  assertHasBaseSellingUnit,
  insertProductRow,
  insertSellingUnitRow,
  deactivateProduct,
  type ProductInput,
  type SellingUnitInput,
} from './catalog/product';

export {
  CatalogService,
  type CatalogProductSummary,
  type CatalogProductRecord,
  type SaveProductFields,
  type SaveProductResult,
} from './catalog/catalog-service';

export {
  seedDemoDatabase,
  countSalesTables,
  countProducts,
  countUsers,
  DEMO_PRODUCT_COUNT,
  DEMO_DEVICE_ID,
  type SeedResult,
} from './seed/demo-seed';

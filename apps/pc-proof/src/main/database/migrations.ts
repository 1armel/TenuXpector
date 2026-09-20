/**
 * Re-export from @tenu/db — migrations registry (probe + foundation).
 */
export {
  MIGRATIONS,
  LATEST_SCHEMA_VERSION,
  CREATE_MIGRATIONS_TABLE_SQL,
  pendingMigrations,
  migrationsToRevert,
  type Migration,
  type MigrationRunner,
} from '@tenu/db';

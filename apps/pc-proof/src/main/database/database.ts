/**
 * Re-export from @tenu/db — EncryptedDatabase lived here in U1 and was lifted in U2.
 * Existing pc-proof imports keep working without a wide rewrite.
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
} from '@tenu/db';

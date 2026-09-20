/**
 * Re-export from @tenu/db — encryption key resolution lifted with EncryptedDatabase.
 */
export {
  ENCRYPTION_KEY_ENV_VAR,
  ENVIRONMENT_ENV_VAR,
  DEVELOPMENT_FALLBACK_KEY,
  MissingEncryptionKeyError,
  isProductionEnvironment,
  resolveEncryptionKey,
  describeEncryptionKey,
  type EncryptionKeySource,
  type ResolvedEncryptionKey,
} from '@tenu/db';

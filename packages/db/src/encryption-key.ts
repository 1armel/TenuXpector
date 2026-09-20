/**
 * Encryption key resolution (NFR8 / ENF-08).
 * No key is committed to the repository. The development fallback is intentionally
 * readable and non-secret so it cannot be mistaken for a production secret.
 */

export const ENCRYPTION_KEY_ENV_VAR = 'TENU_DATABASE_KEY';
export const ENVIRONMENT_ENV_VAR = 'TENU_ENV';

export const DEVELOPMENT_FALLBACK_KEY = 'cle-de-developpement-non-secrete';

export type EncryptionKeySource = 'environment' | 'development-fallback';

export interface ResolvedEncryptionKey {
  readonly key: string;
  readonly source: EncryptionKeySource;
}

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      `Missing encryption key: environment variable ${ENCRYPTION_KEY_ENV_VAR} ` +
        'is required in production. No fallback is allowed outside development (NFR8).',
    );
    this.name = 'MissingEncryptionKeyError';
  }
}

export function isProductionEnvironment(env: NodeJS.ProcessEnv): boolean {
  return env[ENVIRONMENT_ENV_VAR] === 'production';
}

export function resolveEncryptionKey(env: NodeJS.ProcessEnv): ResolvedEncryptionKey {
  const fromEnvironment = env[ENCRYPTION_KEY_ENV_VAR];
  if (typeof fromEnvironment === 'string' && fromEnvironment.length > 0) {
    return { key: fromEnvironment, source: 'environment' };
  }
  if (isProductionEnvironment(env)) throw new MissingEncryptionKeyError();
  return { key: DEVELOPMENT_FALLBACK_KEY, source: 'development-fallback' };
}

export function describeEncryptionKey(resolved: ResolvedEncryptionKey): string {
  return resolved.source === 'environment'
    ? `key from ${ENCRYPTION_KEY_ENV_VAR}`
    : 'development key (non-secret)';
}

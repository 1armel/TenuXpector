/**
 * Résolution de la clé de chiffrement de la base locale (NFR8).
 *
 * Règle tenue ici : **aucune clé n'est écrite dans le dépôt**. La valeur de
 * repli n'est pas une clé — c'est une phrase qui annonce ce qu'elle est, pour
 * qu'on ne puisse ni la confondre avec un secret, ni l'emporter en production
 * par inadvertance. En production, l'absence de la variable d'environnement est
 * une erreur de démarrage, pas un repli silencieux.
 *
 * La valeur de la clé n'est jamais journalisée. Seule sa *provenance* l'est.
 */

export const ENCRYPTION_KEY_ENV_VAR = 'TENU_DATABASE_KEY';
export const ENVIRONMENT_ENV_VAR = 'TENU_ENV';

/**
 * Repli de développement et de test. Volontairement lisible et parlant : ce
 * n'est pas un secret, et il ne doit jamais ressembler à un.
 */
export const DEVELOPMENT_FALLBACK_KEY = 'cle-de-developpement-non-secrete';

export type EncryptionKeySource = 'environment' | 'development-fallback';

export interface ResolvedEncryptionKey {
  readonly key: string;
  readonly source: EncryptionKeySource;
}

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      `Clé de chiffrement absente : la variable d'environnement ${ENCRYPTION_KEY_ENV_VAR} ` +
        "est obligatoire en production. Aucun repli n'est admis hors développement (NFR8).",
    );
    this.name = 'MissingEncryptionKeyError';
  }
}

export function isProductionEnvironment(env: NodeJS.ProcessEnv): boolean {
  return env[ENVIRONMENT_ENV_VAR] === 'production';
}

/**
 * @throws {MissingEncryptionKeyError} en production sans variable d'environnement.
 */
export function resolveEncryptionKey(env: NodeJS.ProcessEnv): ResolvedEncryptionKey {
  const fromEnvironment = env[ENCRYPTION_KEY_ENV_VAR];
  if (typeof fromEnvironment === 'string' && fromEnvironment.length > 0) {
    return { key: fromEnvironment, source: 'environment' };
  }
  if (isProductionEnvironment(env)) throw new MissingEncryptionKeyError();
  return { key: DEVELOPMENT_FALLBACK_KEY, source: 'development-fallback' };
}

/** Description journalisable : la provenance, jamais la valeur. */
export function describeEncryptionKey(resolved: ResolvedEncryptionKey): string {
  return resolved.source === 'environment'
    ? `clé lue dans ${ENCRYPTION_KEY_ENV_VAR}`
    : 'clé de développement (non secrète)';
}

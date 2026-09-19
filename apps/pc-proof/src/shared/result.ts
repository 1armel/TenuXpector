/**
 * Résultat typé.
 *
 * Règle de projet (team.md, Code Style) : « un refus métier attendu est un
 * résultat typé (union discriminée) que l'appelant doit traiter ; une violation
 * d'invariant ou une erreur de programmation lève une exception, jamais
 * rattrapée pour être ignorée ».
 *
 * Ce type est le véhicule du premier cas. Il traverse le pont IPC : une charge
 * invalide revient à l'appelant sous forme d'échec typé, jamais sous forme
 * d'exception brute (CLAUDE.md, NFR8).
 */

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure<C extends string = string> {
  readonly ok: false;
  readonly code: C;
  /** Message destiné au journal technique, jamais affiché tel quel à l'écran. */
  readonly message: string;
}

export type Result<T, C extends string = string> = Success<T> | Failure<C>;

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<C extends string>(code: C, message: string): Failure<C> {
  return { ok: false, code, message };
}

export function isSuccess<T, C extends string>(result: Result<T, C>): result is Success<T> {
  return result.ok;
}

export function isFailure<T, C extends string>(result: Result<T, C>): result is Failure<C> {
  return !result.ok;
}

/**
 * Réduit une valeur inconnue attrapée dans un `catch` à un message exploitable.
 * On ne relaie jamais l'objet d'erreur lui-même au-delà du processus principal :
 * une pile d'appels peut contenir des chemins, voire des valeurs sensibles
 * (NFR8 — aucun secret dans les journaux).
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur inconnue';
}

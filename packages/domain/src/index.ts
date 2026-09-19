/**
 * `@tenu/domain` — fonctions pures du métier.
 *
 * L'unité U1 (preuve de concept PC) n'écrit **aucune** règle métier : ce paquet
 * reste volontairement vide. Il existe dès maintenant pour que la règle ESLint
 * de frontière de couches (interdiction d'importer une base, une interface ou le
 * réseau depuis `packages/domain`) soit posée avant la première règle, et non
 * après. Les premières règles arriveront avec U3.
 */
export const DOMAIN_PACKAGE_NAME = '@tenu/domain';

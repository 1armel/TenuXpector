/**
 * Formatage destiné à l'utilisateur (NFR7, DEC-04, team.md Code Style).
 *
 * Deux invariants tiennent ce fichier :
 *
 * 1. **Aucun flottant.** Un montant est un entier de FCFA. Une valeur non
 *    entière est une erreur de programmation, pas un cas limite à arrondir :
 *    elle lève. C'est le seul moyen d'empêcher un flottant de se glisser dans
 *    la chaîne jusqu'au ticket.
 * 2. **Horodatage en UTC, affichage à l'heure de Douala.** L'instant est
 *    toujours stocké en UTC ; `Africa/Douala` n'intervient qu'au moment du
 *    rendu.
 *
 * Aucune règle de calcul ici : ni TVA, ni remise, ni arrondi métier. Elles
 * appartiennent à U3.
 */

export const DISPLAY_TIME_ZONE = 'Africa/Douala';
export const CURRENCY_LABEL = 'FCFA';

/** Espace insécable fine : sépare les milliers sans permettre de coupure. */
const GROUP_SEPARATOR = ' ';

/**
 * Formate un montant entier de FCFA, par exemple `12500` → `« 12 500 FCFA »`.
 *
 * @throws {RangeError} si le montant n'est pas un entier fini.
 */
export function formatAmountFcfa(amountFcfa: number): string {
  if (!Number.isInteger(amountFcfa)) {
    throw new RangeError(
      `Montant non entier : ${String(amountFcfa)}. Les montants sont des entiers de FCFA (DEC-04).`,
    );
  }
  const negative = amountFcfa < 0;
  const digits = Math.abs(amountFcfa).toString();
  let grouped = '';
  for (let index = 0; index < digits.length; index += 1) {
    const remaining = digits.length - index;
    const digit = digits[index] ?? '';
    grouped += digit;
    if (remaining > 1 && remaining % 3 === 1) grouped += GROUP_SEPARATOR;
  }
  return `${negative ? '-' : ''}${grouped}${GROUP_SEPARATOR}${CURRENCY_LABEL}`;
}

/** Deux chiffres, zéro en tête. */
function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

interface DoualaParts {
  readonly day: string;
  readonly month: string;
  readonly year: string;
  readonly hour: string;
  readonly minute: string;
  readonly second: string;
}

function doualaParts(instant: Date): DoualaParts {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = new Map<Intl.DateTimeFormatPartTypes, string>(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  const read = (type: Intl.DateTimeFormatPartTypes): string => parts.get(type) ?? '00';
  return {
    day: read('day'),
    month: read('month'),
    year: read('year'),
    // `Intl` rend parfois `24` pour minuit en `hour12: false`.
    hour: pad2(Number.parseInt(read('hour'), 10) % 24),
    minute: read('minute'),
    second: read('second'),
  };
}

/** `JJ/MM/AAAA`, à l'heure de Douala. */
export function formatDate(instant: Date): string {
  const parts = doualaParts(instant);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/** `JJ/MM/AAAA HH:MM:SS`, à l'heure de Douala. */
export function formatDateTime(instant: Date): string {
  const parts = doualaParts(instant);
  return `${formatDate(instant)} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** Horodatage de stockage : toujours UTC, toujours la même forme. */
export function toStoredTimestamp(instant: Date): string {
  return instant.toISOString();
}

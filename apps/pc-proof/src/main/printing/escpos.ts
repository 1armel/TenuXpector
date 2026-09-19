/**
 * Composition ESC/POS pour imprimante thermique 80 mm (étape 12 du plan U1).
 *
 * Pas de bibliothèque tierce : le jeu de commandes utilisé ici tient en une
 * dizaine de séquences, et une preuve de concept dont le but est de savoir
 * *ce qui sort vraiment de l'imprimante* a intérêt à contrôler chaque octet.
 *
 * Encodage : page de codes Windows-1252 (`ESC t 16`), qui couvre les accents
 * du français. Les caractères hors de cette page — l'espace insécable fine des
 * montants, par exemple — sont repliés sur un équivalent imprimable plutôt que
 * d'être envoyés tels quels.
 */

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;

/** Largeur en caractères d'une imprimante 80 mm en police A. */
export const COLUMNS_80MM = 48;

export const ESCPOS_COMMANDS = {
  /** `ESC @` — réinitialise l'imprimante. */
  initialize: Uint8Array.from([ESC, 0x40]),
  /** `ESC t 16` — page de codes Windows-1252. */
  selectCodePageWindows1252: Uint8Array.from([ESC, 0x74, 0x10]),
  alignLeft: Uint8Array.from([ESC, 0x61, 0x00]),
  alignCenter: Uint8Array.from([ESC, 0x61, 0x01]),
  alignRight: Uint8Array.from([ESC, 0x61, 0x02]),
  boldOn: Uint8Array.from([ESC, 0x45, 0x01]),
  boldOff: Uint8Array.from([ESC, 0x45, 0x00]),
  /** `GS ! 0x11` — double hauteur et double largeur. */
  doubleSize: Uint8Array.from([GS, 0x21, 0x11]),
  normalSize: Uint8Array.from([GS, 0x21, 0x00]),
  /** `GS V 66 0` — coupe partielle après avance papier. */
  partialCut: Uint8Array.from([GS, 0x56, 0x42, 0x00]),
  lineFeed: Uint8Array.from([LF]),
} as const;

/** Repli des caractères absents de Windows-1252. */
const CHARACTER_FALLBACKS = new Map<string, string>([
  [' ', ' '], // espace insécable fine (séparateur de milliers)
  [' ', ' '], // espace insécable
  ['’', "'"],
  ['‘', "'"],
  ['“', '"'],
  ['”', '"'],
  ['–', '-'],
  ['—', '-'],
  ['…', '...'],
]);

/**
 * Encode un texte en octets Windows-1252. Un caractère inconnu devient `?`
 * plutôt que de produire un octet arbitraire : un ticket lisible avec un `?`
 * vaut mieux qu'un ticket rempli de caractères parasites.
 */
export function encodeText(text: string): Uint8Array {
  let normalized = '';
  for (const character of text) {
    normalized += CHARACTER_FALLBACKS.get(character) ?? character;
  }
  const bytes = new Uint8Array(normalized.length);
  for (let index = 0; index < normalized.length; index += 1) {
    const codePoint = normalized.charCodeAt(index);
    bytes[index] = codePoint <= 0xff ? codePoint : 0x3f; // '?'
  }
  return bytes;
}

export function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export type Alignment = 'left' | 'center' | 'right';

export interface TextLineOptions {
  readonly align?: Alignment;
  readonly bold?: boolean;
  readonly doubleSize?: boolean;
}

/** Une ligne de texte avec ses attributs, remise à l'état neutre après coup. */
export function textLine(text: string, options: TextLineOptions = {}): Uint8Array {
  const chunks: Uint8Array[] = [];
  const align = options.align ?? 'left';
  chunks.push(
    align === 'center'
      ? ESCPOS_COMMANDS.alignCenter
      : align === 'right'
        ? ESCPOS_COMMANDS.alignRight
        : ESCPOS_COMMANDS.alignLeft,
  );
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOn);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.doubleSize);
  chunks.push(encodeText(text), ESCPOS_COMMANDS.lineFeed);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.normalSize);
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOff);
  return concatBytes(chunks);
}

/** Ligne de séparation pleine largeur. */
export function separatorLine(columns: number = COLUMNS_80MM, character = '-'): Uint8Array {
  return textLine(character.repeat(Math.max(1, columns)));
}

/**
 * Une étiquette à gauche, une valeur à droite, remplies par des espaces. Si
 * les deux ne tiennent pas, la valeur est prioritaire : c'est elle qui porte
 * l'information.
 */
export function labelledValueLine(
  label: string,
  value: string,
  columns: number = COLUMNS_80MM,
): Uint8Array {
  const padding = columns - label.length - value.length;
  const text =
    padding >= 1 ? `${label}${' '.repeat(padding)}${value}` : `${label} ${value}`.slice(-columns);
  return textLine(text);
}

export function feedAndCut(feedLines = 4): Uint8Array {
  const feed: Uint8Array[] = [];
  for (let index = 0; index < feedLines; index += 1) feed.push(ESCPOS_COMMANDS.lineFeed);
  return concatBytes([...feed, ESCPOS_COMMANDS.partialCut]);
}

export function documentHeader(): Uint8Array {
  return concatBytes([
    ESCPOS_COMMANDS.initialize,
    ESCPOS_COMMANDS.selectCodePageWindows1252,
    ESCPOS_COMMANDS.alignLeft,
  ]);
}

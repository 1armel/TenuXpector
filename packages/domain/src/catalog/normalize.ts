/**
 * Accent/case-insensitive catalog search helpers [BR3.4].
 */

export interface CatalogSearchHaystack {
  readonly name: string;
  readonly altNames: readonly string[];
  readonly internalCode: string;
  readonly barcode?: string | undefined;
  readonly active: boolean;
}

export interface CatalogSearchOptions {
  readonly includeInactive?: boolean;
}

const ACCENT_MAP: Readonly<Record<string, string>> = {
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  ä: 'a',
  å: 'a',
  ç: 'c',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ñ: 'n',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ö: 'o',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ü: 'u',
  ý: 'y',
  ÿ: 'y',
  æ: 'ae',
  œ: 'oe',
};

/** Normalize for accent/case-insensitive fragment search [BR3.4]. */
export function normalizeSearchText(input: string): string {
  const lower = input.trim().toLocaleLowerCase('fr-FR');
  let out = '';
  for (const char of lower) {
    out += ACCENT_MAP[char] ?? char;
  }
  return out;
}

/** Build the searchable blob for a product [BR3.4]. */
export function buildSearchNormalized(haystack: CatalogSearchHaystack): string {
  const parts = [
    haystack.name,
    ...haystack.altNames,
    haystack.internalCode,
    haystack.barcode ?? '',
  ];
  return normalizeSearchText(parts.filter((part) => part.length > 0).join(' '));
}

/**
 * True when normalized query matches designation, synonyms, code or barcode [BR3.4].
 */
export function matchCatalogSearch(
  haystack: CatalogSearchHaystack,
  query: string,
  options: CatalogSearchOptions = {},
): boolean {
  const includeInactive = options.includeInactive === true;
  if (!haystack.active && !includeInactive) return false;
  const needle = normalizeSearchText(query);
  if (needle.length === 0) return false;
  return buildSearchNormalized(haystack).includes(needle);
}

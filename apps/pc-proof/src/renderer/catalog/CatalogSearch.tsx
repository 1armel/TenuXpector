/**
 * CatalogSearch — combobox query input [FR3.2].
 */
import type { ChangeEvent, JSX } from 'react';

export interface CatalogSearchProps {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly disabled?: boolean;
}

export function CatalogSearch({
  query,
  onQueryChange,
  disabled = false,
}: CatalogSearchProps): JSX.Element {
  return (
    <label className="catalog-search" data-testid="catalog-search">
      <span>Recherche</span>
      <input
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="catalog-result-list"
        aria-expanded={query.trim().length > 0}
        data-testid="catalog-search-input"
        value={query}
        disabled={disabled}
        placeholder="Désignation, code ou code-barres"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onQueryChange(event.target.value);
        }}
      />
    </label>
  );
}

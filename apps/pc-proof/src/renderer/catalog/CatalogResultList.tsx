/**
 * CatalogResultList — listbox of ProductSummary [FR3.2].
 */
import type { JSX } from 'react';

export interface CatalogResultItem {
  readonly id: string;
  readonly name: string;
  readonly internalCode: string;
  readonly referencePrice: number;
}

export interface CatalogResultListProps {
  readonly items: readonly CatalogResultItem[];
  readonly selectedId: string | null;
  readonly onSelect: (productId: string) => void;
  readonly empty: boolean;
  readonly loading: boolean;
}

export function CatalogResultList({
  items,
  selectedId,
  onSelect,
  empty,
  loading,
}: CatalogResultListProps): JSX.Element {
  if (loading) {
    return (
      <p data-testid="catalog-results-loading" role="status">
        Recherche…
      </p>
    );
  }
  if (empty) {
    return (
      <p data-testid="catalog-results-empty" role="status">
        Aucun article trouvé.
      </p>
    );
  }
  return (
    <ul
      id="catalog-result-list"
      role="listbox"
      className="catalog-results"
      data-testid="catalog-result-list"
    >
      {items.map((item) => (
        <li key={item.id} role="option" aria-selected={item.id === selectedId}>
          <button
            type="button"
            data-testid={`catalog-result-${item.id}`}
            className={item.id === selectedId ? 'is-selected' : undefined}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            <span>{item.name}</span>
            <span className="catalog-results__meta">
              {item.internalCode} · {item.referencePrice.toLocaleString('fr-FR')} FCFA
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

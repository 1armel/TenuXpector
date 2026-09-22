/**
 * CatalogShell — search + article pane for C1 [FR3.1 FR3.2 BR3.17].
 */
import { useEffect, useState, type JSX } from 'react';
import type {
  CatalogGetProductResponse,
  CatalogSearchResponse,
  TenuBridge,
} from '../../shared/ipc-contract';
import { ArticleForm, type ArticleFormValues } from './ArticleForm';
import { CatalogResultList } from './CatalogResultList';
import { CatalogSearch } from './CatalogSearch';
import { RoleGate, type CatalogUiRole } from './RoleGate';

export interface CatalogSessionProps {
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly deviceId: string;
  readonly role: CatalogUiRole;
}

export interface CatalogShellProps {
  readonly bridge: TenuBridge;
  readonly session: CatalogSessionProps;
}

const EMPTY_FORM: ArticleFormValues = {
  designation: '',
  baseUnit: 'piece',
  referencePrice: '',
  floorPrice: '',
  averagePurchaseCost: '',
};

export function CatalogShell({ bridge, session }: CatalogShellProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CatalogSearchResponse['items']>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'update' | 'view'>('view');
  const [values, setValues] = useState<ArticleFormValues>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState('Saisissez un fragment pour rechercher.');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      void bridge
        .catalogSearch({
          session: {
            tenantId: session.tenantId,
            actorUserId: session.actorUserId,
            deviceId: session.deviceId,
            role: session.role,
          },
          query: trimmed,
          limit: 50,
        })
        .then((result) => {
          if (cancelled) return;
          setLoading(false);
          if (!result.ok) {
            setStatus(`${result.code} — ${result.message}`);
            setItems([]);
            return;
          }
          setItems(result.value.items);
          setStatus(
            result.value.items.length === 0
              ? 'Aucun article trouvé.'
              : `${String(result.value.items.length)} résultat(s)`,
          );
        });
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [bridge, query, session]);

  async function openProduct(productId: string): Promise<void> {
    setSelectedId(productId);
    setFieldError(null);
    const result = await bridge.catalogGetProduct({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.actorUserId,
        deviceId: session.deviceId,
        role: session.role,
      },
      productId,
    });
    if (!result.ok) {
      setStatus(`${result.code} — ${result.message}`);
      return;
    }
    const product = result.value.product;
    if (product === null) {
      setStatus('Article introuvable.');
      return;
    }
    applyProduct(product, session.role === 'vendeur' ? 'view' : 'update');
  }

  function applyProduct(
    product: NonNullable<CatalogGetProductResponse['product']>,
    nextMode: 'create' | 'update' | 'view',
  ): void {
    setMode(nextMode);
    setValues({
      designation: product.name,
      baseUnit: product.baseUnit,
      referencePrice: String(product.referencePrice),
      floorPrice: String(product.floorPrice),
      averagePurchaseCost:
        product.averagePurchaseCost === undefined || product.averagePurchaseCost === null
          ? ''
          : String(product.averagePurchaseCost),
    });
  }

  function startCreate(): void {
    setSelectedId(null);
    setMode('create');
    setValues(EMPTY_FORM);
    setFieldError(null);
    setStatus('Nouvelle fiche — quatre champs minimum.');
  }

  async function save(): Promise<void> {
    setFieldError(null);
    const referencePrice = Number(values.referencePrice);
    const floorPrice = Number(values.floorPrice);
    if (!Number.isInteger(referencePrice) || !Number.isInteger(floorPrice)) {
      setFieldError('Les montants doivent être des entiers FCFA.');
      return;
    }
    const result = await bridge.catalogSaveProduct({
      session: {
        tenantId: session.tenantId,
        actorUserId: session.actorUserId,
        deviceId: session.deviceId,
        role: session.role,
      },
      mode: mode === 'create' ? 'create' : 'update',
      fields: {
        designation: values.designation,
        baseUnit: values.baseUnit,
        referencePrice,
        floorPrice,
        ...(mode === 'update' && selectedId !== null ? { productId: selectedId } : {}),
        ...(values.averagePurchaseCost.trim().length > 0
          ? { averagePurchaseCost: Number(values.averagePurchaseCost) }
          : {}),
      },
    });
    if (!result.ok) {
      setFieldError(`${result.code} — ${result.message}`);
      return;
    }
    setSelectedId(result.value.productId);
    setMode('update');
    setStatus(`Article enregistré (${result.value.internalCode}).`);
    setQuery(values.designation);
  }

  return (
    <section className="catalog-shell" data-testid="catalog-shell">
      <header className="catalog-shell__header">
        <h2>Catalogue</h2>
        <RoleGate role={session.role} allow={['gerant', 'proprietaire']}>
          <button type="button" data-testid="catalog-new-article" onClick={startCreate}>
            Nouvel article
          </button>
        </RoleGate>
      </header>

      <div className="catalog-shell__panes">
        <div className="catalog-shell__search-pane">
          <CatalogSearch query={query} onQueryChange={setQuery} />
          <CatalogResultList
            items={items}
            selectedId={selectedId}
            empty={!loading && query.trim().length > 0 && items.length === 0}
            loading={loading}
            onSelect={(productId) => {
              void openProduct(productId);
            }}
          />
        </div>
        <div className="catalog-shell__article-pane">
          <ArticleForm
            role={session.role}
            mode={mode}
            values={values}
            fieldError={fieldError}
            onChange={setValues}
            onSubmit={() => {
              void save();
            }}
          />
        </div>
      </div>
      <p className="catalog-shell__status" data-testid="catalog-status" role="status">
        {status}
      </p>
    </section>
  );
}

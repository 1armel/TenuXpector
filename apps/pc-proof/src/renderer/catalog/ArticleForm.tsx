/**
 * ArticleForm — minimal create/edit fields [BR3.9]. Cost nodes never mounted for vendeur [BR3.17].
 */
import type { ChangeEvent, JSX, SyntheticEvent } from 'react';
import { RoleGate, type CatalogUiRole } from './RoleGate';

export interface ArticleFormValues {
  readonly designation: string;
  readonly baseUnit: string;
  readonly referencePrice: string;
  readonly floorPrice: string;
  readonly averagePurchaseCost: string;
}

export interface ArticleFormProps {
  readonly role: CatalogUiRole;
  readonly mode: 'create' | 'update' | 'view';
  readonly values: ArticleFormValues;
  readonly fieldError: string | null;
  readonly onChange: (values: ArticleFormValues) => void;
  readonly onSubmit: () => void;
}

export function ArticleForm({
  role,
  mode,
  values,
  fieldError,
  onChange,
  onSubmit,
}: ArticleFormProps): JSX.Element {
  const readOnly = mode === 'view' || role === 'vendeur';

  function setField<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]): void {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      className="article-form"
      data-testid="article-form"
      onSubmit={(event: SyntheticEvent) => {
        event.preventDefault();
        if (!readOnly) onSubmit();
      }}
    >
      <label>
        Désignation
        <input
          data-testid="article-designation"
          value={values.designation}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setField('designation', event.target.value);
          }}
        />
      </label>
      <label>
        Unité de base
        <input
          data-testid="article-base-unit"
          value={values.baseUnit}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setField('baseUnit', event.target.value);
          }}
        />
      </label>
      <label>
        Prix de vente (FCFA)
        <input
          data-testid="article-reference-price"
          inputMode="numeric"
          value={values.referencePrice}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setField('referencePrice', event.target.value);
          }}
        />
      </label>
      <label>
        Prix plancher (FCFA)
        <input
          data-testid="article-floor-price"
          inputMode="numeric"
          value={values.floorPrice}
          readOnly={readOnly}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setField('floorPrice', event.target.value);
          }}
        />
      </label>
      <RoleGate role={role} allow={['gerant', 'proprietaire']}>
        <label data-testid="article-purchase-cost-field">
          Prix d&apos;achat (FCFA)
          <input
            data-testid="article-purchase-cost"
            inputMode="numeric"
            value={values.averagePurchaseCost}
            readOnly={readOnly}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setField('averagePurchaseCost', event.target.value);
            }}
          />
        </label>
      </RoleGate>
      {fieldError !== null ? (
        <p className="article-form__error" data-testid="article-field-error" role="alert">
          {fieldError}
        </p>
      ) : null}
      <RoleGate role={role} allow={['gerant', 'proprietaire']}>
        <button type="submit" data-testid="article-save" disabled={readOnly}>
          Enregistrer
        </button>
      </RoleGate>
    </form>
  );
}

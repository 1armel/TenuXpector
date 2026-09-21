/**
 * Shared fixtures for domain unit tests.
 */
import type { AlertThresholds, DomainParameters, StockMovementView } from '../src/types';

export const defaultThresholds: AlertThresholds = {
  echantillonMin: 50,
  sousPlancherPb: 1000,
  facteurAtypique: 3,
  facteurSorties: 2,
  ecartMargePb: 500,
  ajustementValeur: 10_000,
  seuilEcartCaisse: 2000,
  fenetreSessions: 10,
  nbManquantsMin: 3,
  cumulManquants: 5000,
};

export const defaultParams: DomainParameters = {
  vatApplicable: true,
  vatRateBp: 1925,
  cashRoundingUnit: 25,
  alertThresholds: defaultThresholds,
};

export function movement(
  partial: Partial<StockMovementView> & Pick<StockMovementView, 'quantityBase' | 'kind'>,
): StockMovementView {
  return {
    productId: '01900000-0000-7000-8000-000000000001',
    storeId: '01900000-0000-7000-8000-000000000002',
    operationDate: '2026-09-01',
    ...partial,
  };
}

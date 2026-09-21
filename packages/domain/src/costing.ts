import { arrondir } from './rounding';
import type { Cump, MoneyFcfa, QuantityBase, StockMovementView } from './types';

export interface CumpState {
  readonly quantity: QuantityBase;
  readonly cump: Cump;
}

/**
 * Recalculate CUMP on an inbound quantity q > 0 at unit cost c [BR3.1, RG-11].
 * If Q_avant ≤ 0 → cump = c; else weighted average via `arrondir`.
 */
export function recalculerCump(
  quantityBefore: QuantityBase,
  cumpBefore: Cump,
  inboundQuantity: QuantityBase,
  unitCostMilli: Cump,
): Cump {
  if (inboundQuantity <= 0) {
    return cumpBefore;
  }
  if (unitCostMilli < 0) {
    throw new Error('recalculerCump: unit cost must be ≥ 0');
  }
  if (quantityBefore <= 0) {
    return unitCostMilli;
  }
  const numerator = quantityBefore * cumpBefore + inboundQuantity * unitCostMilli;
  const denominator = quantityBefore + inboundQuantity;
  const next = arrondir(numerator, denominator);
  return next;
}

function isInboundPurchase(kind: StockMovementView['kind']): boolean {
  return kind === 'ENTREE_ACHAT' || kind === 'ENTREE_INVENTAIRE' || kind === 'RETOUR_ANNULATION';
}

/**
 * Replay an ordered movement history to derive quantity + CUMP [BR3.1, RG-11].
 * Outbounds leave CUMP unchanged. Positive inventory adjustments keep CUMP.
 */
export function appliquerHistoriqueCump(
  movements: readonly StockMovementView[],
  initial: CumpState = { quantity: 0, cump: 0 },
): CumpState {
  let quantity = initial.quantity;
  let cump = initial.cump;

  for (const m of movements) {
    const q = m.quantityBase;
    if (isInboundPurchase(m.kind) && q > 0) {
      const cost = m.unitCostMilli ?? cump;
      cump = recalculerCump(quantity, cump, q, cost);
      quantity += q;
      continue;
    }

    if (m.kind === 'AJUSTEMENT_INVENTAIRE' && q > 0) {
      // Positive inventory adjustment enters at current CUMP — CUMP unchanged [RG-11]
      quantity += q;
      continue;
    }

    // Outbounds / negative adjustments: quantity changes, CUMP unchanged
    quantity += q;
  }

  return { quantity, cump: cump < 0 ? 0 : cump };
}

/** Stock valuation = arrondir(Q × cump, 1_000_000) [BR3.3, RG-12]. */
export function valoriser(quantity: QuantityBase, cump: Cump): MoneyFcfa {
  return arrondir(quantity * cump, 1_000_000);
}

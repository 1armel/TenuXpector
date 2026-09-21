/**
 * Costing [BR3.1–BR3.3, RG-11, RG-12, S2].
 */
import { describe, expect, it } from 'vitest';
import {
  appliquerHistoriqueCump,
  recalculerCump,
  valoriser,
} from '../src/costing';
import { movement } from './helpers';

describe('Costing [BR3.1–BR3.3]', () => {
  it('sets CUMP to inbound cost when Q_avant ≤ 0 [BR3.1, S2]', () => {
    expect(recalculerCump(-5000, 2000, 3000, 4500)).toBe(4500);
    expect(recalculerCump(0, 0, 1000, 3500)).toBe(3500);
  });

  it('computes weighted average when Q_avant > 0', () => {
    // (10_000×3500 + 5000×4500) / 15_000 = 57_500_000 / 15_000 = 3833.333 → 3833
    expect(recalculerCump(10_000, 3500, 5000, 4500)).toBe(3833);
  });

  it('leaves CUMP unchanged on outbound replay', () => {
    const state = appliquerHistoriqueCump([
      movement({ quantityBase: 10_000, kind: 'ENTREE_ACHAT', unitCostMilli: 3500 }),
      movement({ quantityBase: -2000, kind: 'SORTIE_VENTE' }),
    ]);
    expect(state.cump).toBe(3500);
    expect(state.quantity).toBe(8000);
  });

  it('keeps CUMP on positive inventory adjustment [RG-11]', () => {
    const state = appliquerHistoriqueCump([
      movement({ quantityBase: 5000, kind: 'ENTREE_ACHAT', unitCostMilli: 2000 }),
      movement({ quantityBase: 1000, kind: 'AJUSTEMENT_INVENTAIRE', unitCostMilli: 9999 }),
    ]);
    expect(state.cump).toBe(2000);
    expect(state.quantity).toBe(6000);
  });

  it('values stock with RG-12 scaling [BR3.3]', () => {
    // 24_000 milli × 3500 milli-FCFA / 1_000_000 = 84
    expect(valoriser(24_000, 3500)).toBe(84);
  });

  it('never returns negative CUMP after recalcul [BR3.2]', () => {
    expect(recalculerCump(1000, 0, 1000, 0)).toBe(0);
  });

  it('rejects negative unit cost', () => {
    expect(() => recalculerCump(1000, 2000, 500, -1)).toThrow(/unit cost/);
  });

  it('clamps negative initial CUMP to 0 on replay', () => {
    const state = appliquerHistoriqueCump(
      [movement({ quantityBase: -100, kind: 'SORTIE_VENTE' })],
      { quantity: 500, cump: -10 },
    );
    expect(state.cump).toBe(0);
  });

  it('handles ENTREE_INVENTAIRE and RETOUR_ANNULATION as inbound', () => {
    const state = appliquerHistoriqueCump([
      movement({ quantityBase: 1000, kind: 'ENTREE_INVENTAIRE', unitCostMilli: 2000 }),
      movement({ quantityBase: 500, kind: 'RETOUR_ANNULATION', unitCostMilli: 2000 }),
    ]);
    expect(state.quantity).toBe(1500);
    expect(state.cump).toBe(2000);
  });

  it('uses current CUMP when inbound omits unitCostMilli', () => {
    const state = appliquerHistoriqueCump([
      movement({ quantityBase: 1000, kind: 'ENTREE_ACHAT', unitCostMilli: 3000 }),
      movement({ quantityBase: 1000, kind: 'ENTREE_ACHAT' }),
    ]);
    expect(state.cump).toBe(3000);
  });
});

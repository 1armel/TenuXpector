/**
 * Property tests EF-U1-11 / FR2.10 [BR2.5, BR3.2] — integer generators only [DEC-04].
 */
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { appliquerHistoriqueCump } from '../src/costing';
import { quantiteStock } from '../src/stock-ledger';
import type { StockMovementView } from '../src/types';
import { movement } from './helpers';

const qtyArb = fc.integer({ min: -50_000, max: 50_000 });
const costArb = fc.integer({ min: 0, max: 100_000 });

describe('properties EF-U1-11 [BR2.5, BR3.2, S5]', () => {
  it('quantiteStock is commutative (order-independent) [BR2.5]', () => {
    fc.assert(
      fc.property(fc.array(qtyArb, { minLength: 0, maxLength: 20 }), (qtys) => {
        const moves = qtys.map((quantityBase, i) =>
          movement({
            quantityBase,
            kind: quantityBase >= 0 ? 'ENTREE_ACHAT' : 'SORTIE_VENTE',
            operationDate: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
          }),
        );
        const shuffled = [...moves].sort(() => 0); // deterministic copy
        const reversed = [...moves].reverse();
        expect(quantiteStock(moves)).toBe(quantiteStock(shuffled));
        expect(quantiteStock(moves)).toBe(quantiteStock(reversed));
      }),
      { numRuns: 50 },
    );
  });

  it('movement + inverse restores quantity [BR3.2, S5]', () => {
    fc.assert(
      fc.property(qtyArb.filter((q) => q !== 0), costArb, (q, cost) => {
        const forward: StockMovementView = movement({
          quantityBase: q,
          kind: q > 0 ? 'ENTREE_ACHAT' : 'SORTIE_VENTE',
          unitCostMilli: cost,
        });
        const inverse: StockMovementView = movement({
          quantityBase: -q,
          kind: q > 0 ? 'SORTIE_VENTE' : 'ENTREE_ACHAT',
          unitCostMilli: cost,
        });
        expect(quantiteStock([forward, inverse])).toBe(0);
      }),
      { numRuns: 50 },
    );
  });

  it('CUMP stays ≥ 0 after any replay [BR3.2]', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            q: qtyArb,
            cost: costArb,
          }),
          { minLength: 1, maxLength: 15 },
        ),
        (steps) => {
          const moves = steps.map(({ q, cost }) =>
            movement({
              quantityBase: q,
              kind: q >= 0 ? 'ENTREE_ACHAT' : 'SORTIE_VENTE',
              unitCostMilli: cost,
            }),
          );
          const state = appliquerHistoriqueCump(moves);
          expect(state.cump).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 50 },
    );
  });
});

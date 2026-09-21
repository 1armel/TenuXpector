/**
 * StockLedger [BR2.1–BR2.4, RG-10, S1].
 */
import { describe, expect, it } from 'vitest';
import {
  etatStockAu,
  quantiteStock,
  versUniteBase,
  versUniteVente,
} from '../src/stock-ledger';
import { movement } from './helpers';

describe('StockLedger [BR2.1–BR2.4]', () => {
  it('sums signed base quantities [BR2.1, RG-10]', () => {
    const q = quantiteStock([
      movement({ quantityBase: 10_000, kind: 'ENTREE_ACHAT' }),
      movement({ quantityBase: -3000, kind: 'SORTIE_VENTE' }),
      movement({ quantityBase: 500, kind: 'AJUSTEMENT_INVENTAIRE' }),
    ]);
    expect(q).toBe(7500);
  });

  it('etatStockAu filters by operationDate inclusive [BR2.2]', () => {
    const moves = [
      movement({ quantityBase: 5000, kind: 'ENTREE_ACHAT', operationDate: '2026-01-01' }),
      movement({ quantityBase: -1000, kind: 'SORTIE_VENTE', operationDate: '2026-01-15' }),
      movement({ quantityBase: -2000, kind: 'SORTIE_VENTE', operationDate: '2026-02-01' }),
    ];
    expect(etatStockAu(moves, '2026-01-15')).toBe(4000);
    expect(etatStockAu(moves, '2025-12-31')).toBe(0);
  });

  it('allows negative stock without domain error [BR2.3, S1]', () => {
    const q = quantiteStock([
      movement({ quantityBase: 0, kind: 'ENTREE_ACHAT' }),
      movement({ quantityBase: -1500, kind: 'SORTIE_VENTE' }),
    ]);
    expect(q).toBe(-1500);
  });

  it('converts sale unit ↔ base without floats [BR2.4]', () => {
    const unit = {
      productId: 'p1',
      label: 'boite',
      factorToBaseMilli: 12_000, // 12 pieces per box
    };
    const base = versUniteBase(2000, unit); // 2 boxes
    expect(base.ok).toBe(true);
    if (base.ok) {
      expect(base.value).toBe(24_000);
      const back = versUniteVente(base.value, unit);
      expect(back.ok && back.value).toBe(2000);
    }
  });

  it('rejects factor < 1', () => {
    const bad = { productId: 'p1', label: 'x', factorToBaseMilli: 0 };
    expect(versUniteBase(1000, bad)).toEqual({ ok: false, error: 'INVALID_FACTOR' });
    expect(versUniteVente(1000, bad)).toEqual({ ok: false, error: 'INVALID_FACTOR' });
  });

  it('rejects non-integer quantities [DEC-04]', () => {
    const unit = { productId: 'p1', label: 'u', factorToBaseMilli: 1000 };
    expect(() => versUniteBase(1.5, unit)).toThrow(/integer/);
    expect(() => versUniteVente(1.5, unit)).toThrow(/integer/);
  });

  it('rejects non-integer factor', () => {
    const bad = { productId: 'p1', label: 'x', factorToBaseMilli: 1.5 };
    expect(versUniteBase(1000, bad)).toEqual({ ok: false, error: 'INVALID_FACTOR' });
  });
});

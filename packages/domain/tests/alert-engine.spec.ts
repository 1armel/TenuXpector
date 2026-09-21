/**
 * AlertEngine event + periodic [BR7.1–BR7.3].
 */
import { describe, expect, it } from 'vitest';
import {
  evaluerAlertes,
  evaluerAlertesPeriodiques,
  tauxPour100Tickets,
} from '../src/alert-engine';
import type { AlertContext, AlertHistory } from '../src/types';
import { defaultParams } from './helpers';

const ctx: AlertContext = {
  storeId: 'store-1',
  clockInstant: '2026-09-21T10:00:00Z',
  operatorId: 'op-1',
  sessionId: 'sess-1',
};

describe('evaluerAlertes événementiel [BR7.1–BR7.2]', () => {
  it('emits AL-01 when |variance| exceeds threshold', () => {
    const alerts = evaluerAlertes(
      { kind: 'session_closed', payload: { variance: -2500 } },
      ctx,
      defaultParams,
    );
    expect(alerts.some((a) => a.code === 'AL-01' && a.severity === 'haute')).toBe(true);
    expect(alerts[0]?.parameterSnapshot.seuilEcartCaisse).toBe(2000);
  });

  it('emits AL-01 moyenne on excess over threshold', () => {
    const alerts = evaluerAlertes(
      { kind: 'session_closed', payload: { variance: 2500 } },
      ctx,
      defaultParams,
    );
    expect(alerts.some((a) => a.code === 'AL-01' && a.severity === 'moyenne')).toBe(true);
  });

  it('skips AL-01 when |variance| ≤ threshold', () => {
    expect(
      evaluerAlertes(
        { kind: 'session_closed', payload: { variance: -500 } },
        ctx,
        defaultParams,
      ),
    ).toHaveLength(0);
  });

  it('skips AL-02 when opening variance is 0', () => {
    expect(
      evaluerAlertes(
        { kind: 'session_opened', payload: { openingVariance: 0 } },
        ctx,
        defaultParams,
      ),
    ).toHaveLength(0);
  });

  it('emits AL-03 / AL-04 unconditionally for force-close and cancel', () => {
    expect(
      evaluerAlertes({ kind: 'session_force_closed', payload: {} }, ctx, defaultParams).map(
        (a) => a.code,
      ),
    ).toEqual(['AL-03']);
    expect(
      evaluerAlertes({ kind: 'sale_cancelled', payload: {} }, ctx, defaultParams).map(
        (a) => a.code,
      ),
    ).toEqual(['AL-04']);
  });

  it('emits AL-05 when under-floor gap exceeds threshold', () => {
    const alerts = evaluerAlertes(
      { kind: 'line_priced', payload: { underFloor: true, floorGapBp: 1500 } },
      ctx,
      defaultParams,
    );
    expect(alerts.map((a) => a.code)).toContain('AL-05');
  });

  it('does not emit AL-05 under threshold', () => {
    const alerts = evaluerAlertes(
      { kind: 'line_priced', payload: { underFloor: true, floorGapBp: 500 } },
      ctx,
      defaultParams,
    );
    expect(alerts).toHaveLength(0);
  });

  it('emits AL-08 with severity based on adjustment value', () => {
    const low = evaluerAlertes(
      { kind: 'stock_adjusted', payload: { adjustmentValue: 100 } },
      ctx,
      defaultParams,
    );
    expect(low[0]?.severity).toBe('basse');
    const high = evaluerAlertes(
      { kind: 'stock_adjusted', payload: { adjustmentValue: 20_000 } },
      ctx,
      defaultParams,
    );
    expect(high[0]?.severity).toBe('moyenne');
  });

  it('emits AL-09 on negative stock without blocking [BR7.2, S1]', () => {
    const alerts = evaluerAlertes(
      {
        kind: 'stock_changed',
        payload: { quantityBase: -100, movementKind: 'SORTIE_VENTE' },
      },
      ctx,
      defaultParams,
    );
    expect(alerts.map((a) => a.code)).toContain('AL-09');
    expect(alerts.find((a) => a.code === 'AL-09')?.severity).toBe('basse');
  });

  it('emits AL-16 for unexplained rupture (non-sale to ≤ 0)', () => {
    const alerts = evaluerAlertes(
      {
        kind: 'stock_changed',
        payload: { quantityBase: 0, movementKind: 'SORTIE_PERTE' },
      },
      ctx,
      defaultParams,
    );
    expect(alerts.map((a) => a.code)).toContain('AL-16');
  });

  it('emits AL-18 when stock under article threshold', () => {
    const alerts = evaluerAlertes(
      {
        kind: 'stock_changed',
        payload: {
          quantityBase: 50,
          movementKind: 'SORTIE_VENTE',
          alertStockThreshold: 100,
        },
      },
      ctx,
      defaultParams,
    );
    expect(alerts.map((a) => a.code)).toContain('AL-18');
  });

  it('does not emit AL-10 on cash_outflow [R-09]', () => {
    const alerts = evaluerAlertes(
      { kind: 'cash_outflow', payload: { amount: 50_000 } },
      ctx,
      defaultParams,
    );
    expect(alerts).toHaveLength(0);
  });
});

describe('evaluerAlertesPeriodiques [BR7.3]', () => {
  it('emits AL-06 on repeated small shortages', () => {
    const history: AlertHistory = {
      recentSessions: [
        { operatorId: 'op-1', variance: -1800, cashOutflows: 0, missingAmount: 1800 },
        { operatorId: 'op-1', variance: -1800, cashOutflows: 0, missingAmount: 1800 },
        { operatorId: 'op-1', variance: -1800, cashOutflows: 0, missingAmount: 1800 },
      ],
      operatorTicketStats30d: [],
    };
    const alerts = evaluerAlertesPeriodiques(history, defaultParams, ctx);
    expect(alerts.map((a) => a.code)).toContain('AL-06');
  });

  it('emits AL-07 when operator rates exceed atypical factor', () => {
    const history: AlertHistory = {
      recentSessions: [],
      operatorTicketStats30d: [
        {
          operatorId: 'op-1',
          ticketCount: 100,
          cancellationCount: 40,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 1000,
        },
        {
          operatorId: 'op-2',
          ticketCount: 100,
          cancellationCount: 1,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 1000,
        },
      ],
      peerOperatorMedians30d: {
        cancellationRate: 1,
        discountRate: 1,
        underFloorRate: 1,
        averageMarginBp: 1000,
      },
    };
    const alerts = evaluerAlertesPeriodiques(history, defaultParams, ctx);
    expect(alerts.map((a) => a.code)).toContain('AL-07');
  });

  it('skips periodic rules without operatorId', () => {
    const alerts = evaluerAlertesPeriodiques(
      { recentSessions: [], operatorTicketStats30d: [] },
      defaultParams,
      { storeId: 's', clockInstant: '2026-09-21T10:00:00Z' },
    );
    expect(alerts).toHaveLength(0);
  });

  it('skips AL-07 when sample below echantillonMin [BR7.3]', () => {
    const history: AlertHistory = {
      recentSessions: [],
      operatorTicketStats30d: [
        {
          operatorId: 'op-1',
          ticketCount: 10,
          cancellationCount: 9,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 1000,
        },
        {
          operatorId: 'op-2',
          ticketCount: 100,
          cancellationCount: 1,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 1000,
        },
      ],
      peerOperatorMedians30d: {
        cancellationRate: 1,
        discountRate: 1,
        underFloorRate: 1,
        averageMarginBp: 1000,
      },
    };
    const alerts = evaluerAlertesPeriodiques(history, defaultParams, ctx);
    expect(alerts.map((a) => a.code)).not.toContain('AL-07');
  });

  it('emits AL-10 from sliding history not cash_outflow event', () => {
    const sessions = Array.from({ length: 6 }, (_, i) => ({
      operatorId: 'op-1',
      variance: 0,
      cashOutflows: i === 5 ? 20_000 : 1000,
      missingAmount: 0,
    }));
    const history: AlertHistory = {
      recentSessions: sessions,
      operatorTicketStats30d: [],
    };
    const alerts = evaluerAlertesPeriodiques(history, defaultParams, ctx);
    expect(alerts.map((a) => a.code)).toContain('AL-10');
  });

  it('emits AL-11 when operator margin lags peers', () => {
    const history: AlertHistory = {
      recentSessions: [],
      operatorTicketStats30d: [
        {
          operatorId: 'op-1',
          ticketCount: 60,
          cancellationCount: 0,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 100,
        },
        {
          operatorId: 'op-2',
          ticketCount: 60,
          cancellationCount: 0,
          discountCount: 0,
          underFloorCount: 0,
          averageMarginBp: 1000,
        },
      ],
      peerOperatorMedians30d: {
        cancellationRate: 1,
        discountRate: 1,
        underFloorRate: 1,
        averageMarginBp: 1000,
      },
    };
    const alerts = evaluerAlertesPeriodiques(history, defaultParams, ctx);
    expect(alerts.map((a) => a.code)).toContain('AL-11');
  });

  it('tauxPour100Tickets returns null under sample floor', () => {
    expect(tauxPour100Tickets(5, 40, 50)).toBeNull();
    expect(tauxPour100Tickets(5, 50, 50)).toBe(10);
  });
});

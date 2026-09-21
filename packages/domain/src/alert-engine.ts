import type {
  Alert,
  AlertContext,
  AlertHistory,
  AlertSeverity,
  DomainEvent,
  DomainParameters,
  OperatorTicketStats,
  SessionHistoryEntry,
} from './types';

function baseAlert(
  code: string,
  severity: AlertSeverity,
  ctx: AlertContext,
  triggerValues: Alert['triggerValues'],
  parameterSnapshot: Alert['parameterSnapshot'],
): Alert {
  const alert: Alert = {
    code,
    severity,
    triggerValues,
    parameterSnapshot,
  };
  return {
    ...alert,
    ...(ctx.operatorId !== undefined ? { operatorId: ctx.operatorId } : {}),
    ...(ctx.sessionId !== undefined ? { sessionId: ctx.sessionId } : {}),
    ...(ctx.relatedEntityId !== undefined ? { relatedEntityId: ctx.relatedEntityId } : {}),
  };
}

/**
 * Event-driven alerts AL-01…05, AL-08, AL-09, AL-16, AL-18 [BR7.1–BR7.2].
 * `cash_outflow` does not emit AL-10 (R-09).
 */
export function evaluerAlertes(
  event: DomainEvent,
  ctx: AlertContext,
  params: DomainParameters,
): Alert[] {
  const t = params.alertThresholds;
  const alerts: Alert[] = [];

  switch (event.kind) {
    case 'session_closed': {
      const absVar = Math.abs(event.payload.variance);
      if (absVar > t.seuilEcartCaisse) {
        alerts.push(
          baseAlert(
            'AL-01',
            event.payload.variance < 0 ? 'haute' : 'moyenne',
            ctx,
            { variance: event.payload.variance, absVariance: absVar },
            { seuilEcartCaisse: t.seuilEcartCaisse },
          ),
        );
      }
      break;
    }
    case 'session_opened': {
      if (event.payload.openingVariance !== 0) {
        alerts.push(
          baseAlert(
            'AL-02',
            'moyenne',
            ctx,
            { openingVariance: event.payload.openingVariance },
            {},
          ),
        );
      }
      break;
    }
    case 'session_force_closed': {
      alerts.push(baseAlert('AL-03', 'moyenne', ctx, {}, {}));
      break;
    }
    case 'sale_cancelled': {
      alerts.push(baseAlert('AL-04', 'haute', ctx, {}, {}));
      break;
    }
    case 'line_priced': {
      if (event.payload.underFloor && event.payload.floorGapBp > t.sousPlancherPb) {
        alerts.push(
          baseAlert(
            'AL-05',
            'moyenne',
            ctx,
            {
              underFloor: event.payload.underFloor,
              floorGapBp: event.payload.floorGapBp,
            },
            { sousPlancherPb: t.sousPlancherPb },
          ),
        );
      }
      break;
    }
    case 'stock_adjusted': {
      const value = Math.abs(event.payload.adjustmentValue);
      alerts.push(
        baseAlert(
          'AL-08',
          value > t.ajustementValeur ? 'moyenne' : 'basse',
          ctx,
          { adjustmentValue: event.payload.adjustmentValue },
          { ajustementValeur: t.ajustementValeur },
        ),
      );
      break;
    }
    case 'stock_changed': {
      const q = event.payload.quantityBase;
      if (q < 0) {
        alerts.push(
          baseAlert('AL-09', 'basse', ctx, { quantityBase: q }, {}),
        );
      }
      if (
        q <= 0 &&
        event.payload.movementKind !== 'SORTIE_VENTE' &&
        event.payload.movementKind !== 'RETOUR_ANNULATION'
      ) {
        alerts.push(
          baseAlert(
            'AL-16',
            'moyenne',
            ctx,
            { quantityBase: q, movementKind: event.payload.movementKind },
            {},
          ),
        );
      }
      const threshold = event.payload.alertStockThreshold;
      if (threshold !== undefined && q < threshold && q >= 0) {
        alerts.push(
          baseAlert(
            'AL-18',
            'basse',
            ctx,
            { quantityBase: q, alertStockThreshold: threshold },
            { alertStockThreshold: threshold },
          ),
        );
      }
      break;
    }
    case 'cash_outflow':
      // Feeds AlertHistory only — no direct AL-10 [R-09]
      break;
  }

  return alerts;
}

function ratePer100(events: number, tickets: number): number {
  return Math.floor((events * 1000) / tickets) / 10;
}

function countMissingUnderThreshold(
  sessions: readonly SessionHistoryEntry[],
  operatorId: string,
  window: number,
  seuil: number,
): { count: number; cumul: number } {
  const own = sessions.filter((s) => s.operatorId === operatorId).slice(-window);
  let count = 0;
  let cumul = 0;
  for (const s of own) {
    if (s.missingAmount > 0 && s.missingAmount <= seuil) {
      count += 1;
      cumul += s.missingAmount;
    }
  }
  return { count, cumul };
}

/**
 * Sliding-window alerts AL-06, AL-07, AL-10, AL-11 [BR7.1, BR7.3].
 */
export function evaluerAlertesPeriodiques(
  history: AlertHistory,
  params: DomainParameters,
  ctx: AlertContext,
): Alert[] {
  const t = params.alertThresholds;
  const alerts: Alert[] = [];
  const operatorId = ctx.operatorId;

  if (operatorId !== undefined) {
    const { count, cumul } = countMissingUnderThreshold(
      history.recentSessions,
      operatorId,
      t.fenetreSessions,
      t.seuilEcartCaisse,
    );
    if (count >= t.nbManquantsMin && cumul >= t.cumulManquants) {
      alerts.push(
        baseAlert(
          'AL-06',
          'haute',
          ctx,
          { missingCount: count, cumulManquants: cumul },
          {
            fenetreSessions: t.fenetreSessions,
            nbManquantsMin: t.nbManquantsMin,
            cumulManquants: t.cumulManquants,
          },
        ),
      );
    }
  }

  const peers = history.peerOperatorMedians30d;
  const stats = history.operatorTicketStats30d;
  if (peers !== undefined && stats.length >= 2 && operatorId !== undefined) {
    const op = stats.find((s) => s.operatorId === operatorId);
    if (op !== undefined && op.ticketCount >= t.echantillonMin) {
      const cancelRate = ratePer100(op.cancellationCount, op.ticketCount);
      const discountRate = ratePer100(op.discountCount, op.ticketCount);
      const underFloorRate = ratePer100(op.underFloorCount, op.ticketCount);
      const atypical =
        cancelRate > peers.cancellationRate * t.facteurAtypique ||
        discountRate > peers.discountRate * t.facteurAtypique ||
        underFloorRate > peers.underFloorRate * t.facteurAtypique;
      if (atypical) {
        alerts.push(
          baseAlert(
            'AL-07',
            'moyenne',
            ctx,
            { cancelRate, discountRate, underFloorRate },
            { facteurAtypique: t.facteurAtypique, echantillonMin: t.echantillonMin },
          ),
        );
      }

      if (peers.averageMarginBp - op.averageMarginBp > t.ecartMargePb) {
        alerts.push(
          baseAlert(
            'AL-11',
            'moyenne',
            ctx,
            {
              operatorMarginBp: op.averageMarginBp,
              peerMedianMarginBp: peers.averageMarginBp,
            },
            { ecartMargePb: t.ecartMargePb },
          ),
        );
      }
    }
  }

  // AL-10: session cash outflows > factor × mean of last 20 sessions (min 5)
  if (operatorId !== undefined) {
    const own = history.recentSessions.filter((s) => s.operatorId === operatorId);
    if (own.length >= 5) {
      const window = own.slice(-20);
      const current = window[window.length - 1];
      const prior = window.slice(0, -1);
      if (current !== undefined && prior.length >= 4) {
        let sum = 0;
        for (const s of prior) {
          sum += s.cashOutflows;
        }
        const mean = Math.floor(sum / prior.length);
        if (mean > 0 && current.cashOutflows > mean * t.facteurSorties) {
          alerts.push(
            baseAlert(
              'AL-10',
              'moyenne',
              ctx,
              { cashOutflows: current.cashOutflows, meanPrior: mean },
              { facteurSorties: t.facteurSorties },
            ),
          );
        }
      }
    }
  }

  return alerts;
}

/** RG-30 rate for 100 tickets; insufficient sample → null [BR7.3]. */
export function tauxPour100Tickets(
  eventCount: number,
  ticketCount: number,
  echantillonMin: number,
): number | null {
  if (ticketCount < echantillonMin) {
    return null;
  }
  return ratePer100(eventCount, ticketCount);
}

export type { OperatorTicketStats, SessionHistoryEntry };

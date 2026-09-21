/**
 * DEC-04 scalar units and immutable calculation views for `@tenu/domain`.
 * All money / quantity / CUMP / rate values are integers — never floats.
 */

export type MoneyFcfa = number;
export type QuantityBase = number;
export type Cump = number;
export type RateBp = number;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export type StockMovementKind =
  | 'ENTREE_ACHAT'
  | 'ENTREE_INVENTAIRE'
  | 'AJUSTEMENT_INVENTAIRE'
  | 'SORTIE_VENTE'
  | 'SORTIE_CASSE'
  | 'SORTIE_PERTE'
  | 'SORTIE_USAGE_INTERNE'
  | 'RETOUR_ANNULATION';

export interface StockMovementView {
  readonly productId: string;
  readonly storeId: string;
  readonly quantityBase: QuantityBase;
  readonly unitCostMilli?: Cump;
  readonly operationDate: string;
  readonly kind: StockMovementKind;
}

export interface SellingUnitView {
  readonly productId: string;
  readonly label: string;
  readonly factorToBaseMilli: number;
}

export interface PricedLine {
  readonly referencePrice: MoneyFcfa;
  readonly appliedPrice: MoneyFcfa;
  readonly floorPrice: MoneyFcfa;
  readonly saleQuantityMilli: number;
  readonly lineDiscount: MoneyFcfa;
  readonly underFloor: boolean;
  readonly floorGapBp: number;
  readonly lineAmountTtc: MoneyFcfa;
  readonly lineAmountHt?: MoneyFcfa;
  readonly quantityBase?: QuantityBase;
  readonly cumpAtSale?: Cump;
}

export type PaymentMode =
  | 'especes'
  | 'camtel'
  | 'mtn_momo'
  | 'orange_money'
  | 'virement'
  | 'credit';

export interface PaymentItem {
  readonly amount: MoneyFcfa;
  readonly mode: PaymentMode;
  readonly reference?: string;
}

export interface SaleTotals {
  readonly totalTtc: MoneyFcfa;
  readonly totalHt: MoneyFcfa;
  readonly vatAmount: MoneyFcfa;
  readonly totalDiscount: MoneyFcfa;
  readonly totalMargin: MoneyFcfa;
  readonly cashRoundingDelta: MoneyFcfa;
}

export interface PaymentPlan {
  readonly payments: readonly PaymentItem[];
  readonly totalPaid: MoneyFcfa;
  readonly changeDue: MoneyFcfa;
  readonly netCash: MoneyFcfa;
}

export interface SessionCashPosition {
  readonly theoreticalCash: MoneyFcfa;
  readonly countedCash: MoneyFcfa;
  readonly variance: MoneyFcfa;
  readonly amountToDeposit: MoneyFcfa;
  readonly floatLeft: MoneyFcfa;
}

export type AlertSeverity = 'haute' | 'moyenne' | 'basse';

export interface Alert {
  readonly code: string;
  readonly severity: AlertSeverity;
  readonly operatorId?: string;
  readonly sessionId?: string;
  readonly relatedEntityId?: string;
  readonly triggerValues: Readonly<Record<string, number | string | boolean>>;
  readonly parameterSnapshot: Readonly<Record<string, number | string | boolean>>;
}

export interface AlertThresholds {
  readonly echantillonMin: number;
  readonly sousPlancherPb: number;
  readonly facteurAtypique: number;
  readonly facteurSorties: number;
  readonly ecartMargePb: number;
  readonly ajustementValeur: MoneyFcfa;
  readonly seuilEcartCaisse: MoneyFcfa;
  readonly fenetreSessions: number;
  readonly nbManquantsMin: number;
  readonly cumulManquants: MoneyFcfa;
}

export interface DomainParameters {
  readonly vatApplicable: boolean;
  readonly vatRateBp?: RateBp;
  readonly cashRoundingUnit: number;
  readonly alertThresholds: AlertThresholds;
}

export type DomainEventKind =
  | 'stock_changed'
  | 'stock_adjusted'
  | 'line_priced'
  | 'sale_cancelled'
  | 'session_opened'
  | 'session_closed'
  | 'session_force_closed'
  | 'cash_outflow';

export type DomainEvent =
  | {
      readonly kind: 'stock_changed';
      readonly payload: {
        readonly quantityBase: QuantityBase;
        readonly movementKind: StockMovementKind;
        readonly alertStockThreshold?: QuantityBase;
      };
    }
  | {
      readonly kind: 'stock_adjusted';
      readonly payload: { readonly adjustmentValue: MoneyFcfa };
    }
  | {
      readonly kind: 'line_priced';
      readonly payload: { readonly underFloor: boolean; readonly floorGapBp: number };
    }
  | { readonly kind: 'sale_cancelled'; readonly payload: Record<string, never> }
  | {
      readonly kind: 'session_opened';
      readonly payload: { readonly openingVariance: MoneyFcfa };
    }
  | {
      readonly kind: 'session_closed';
      readonly payload: { readonly variance: MoneyFcfa };
    }
  | { readonly kind: 'session_force_closed'; readonly payload: Record<string, never> }
  | {
      readonly kind: 'cash_outflow';
      readonly payload: { readonly amount: MoneyFcfa };
    };

export interface AlertContext {
  readonly storeId: string;
  readonly clockInstant: string;
  readonly operatorId?: string;
  readonly sessionId?: string;
  readonly currentQuantityBase?: QuantityBase;
  readonly relatedEntityId?: string;
}

export interface SessionHistoryEntry {
  readonly operatorId: string;
  readonly variance: MoneyFcfa;
  readonly cashOutflows: MoneyFcfa;
  readonly missingAmount: MoneyFcfa;
}

export interface OperatorTicketStats {
  readonly operatorId: string;
  readonly ticketCount: number;
  readonly cancellationCount: number;
  readonly discountCount: number;
  readonly underFloorCount: number;
  readonly averageMarginBp: number;
}

export interface AlertHistory {
  readonly recentSessions: readonly SessionHistoryEntry[];
  readonly operatorTicketStats30d: readonly OperatorTicketStats[];
  readonly peerOperatorMedians30d?: {
    readonly cancellationRate: number;
    readonly discountRate: number;
    readonly underFloorRate: number;
    readonly averageMarginBp: number;
  };
}

export interface DailyReportInput {
  readonly day: string;
  readonly ticketCount: number;
  readonly salesTtc: MoneyFcfa;
  readonly cashVarianceSummary: Readonly<Record<string, number>>;
  readonly alertsSummary: Readonly<Record<string, number>>;
  readonly operatorRates?: Readonly<
    Record<
      string,
      {
        readonly ticketCount: number;
        readonly eventCount: number;
      }
    >
  >;
}

export interface DailyReport {
  readonly day: string;
  readonly ticketCount: number;
  readonly salesTtc: MoneyFcfa;
  readonly cashVarianceSummary: Readonly<Record<string, number>>;
  readonly alertsSummary: Readonly<Record<string, number>>;
  readonly operatorRates?: Readonly<
    Record<
      string,
      {
        readonly ticketCount: number;
        readonly eventCount: number;
        readonly ratePer100: number | 'echantillon_insuffisant';
      }
    >
  >;
}

export type PaymentPlanError = 'INSUFFICIENT_PAYMENT' | 'CHANGE_EXCEEDS_CASH';

export type CashSessionError = 'FLOAT_LEFT_OUT_OF_BOUNDS';

export type ConversionError = 'INVALID_FACTOR';

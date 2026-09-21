/**
 * `@tenu/domain` — pure business rules (U3 / exigences U1).
 * No database, UI, or network dependencies [BR9.1].
 */

export { arrondir, roundCashToUnit } from './rounding';
export {
  quantiteStock,
  etatStockAu,
  versUniteBase,
  versUniteVente,
} from './stock-ledger';
export {
  recalculerCump,
  appliquerHistoriqueCump,
  valoriser,
  type CumpState,
} from './costing';
export { priceLine, type PriceLineInput } from './pricing';
export {
  computeSaleTotals,
  buildPaymentPlan,
  applyCashRoundingToPayments,
  finalizeSale,
  type SaleComputation,
} from './sale-calculator';
export {
  theoreticalCash,
  computeSessionCashPosition,
  type CashSessionInput,
} from './cash-session';
export {
  evaluerAlertes,
  evaluerAlertesPeriodiques,
  tauxPour100Tickets,
} from './alert-engine';
export { rapportJournalier } from './reporting';
export {
  ok,
  err,
  type Result,
  type MoneyFcfa,
  type QuantityBase,
  type Cump,
  type RateBp,
  type StockMovementKind,
  type StockMovementView,
  type SellingUnitView,
  type PricedLine,
  type PaymentMode,
  type PaymentItem,
  type SaleTotals,
  type PaymentPlan,
  type SessionCashPosition,
  type AlertSeverity,
  type Alert,
  type AlertThresholds,
  type DomainParameters,
  type DomainEventKind,
  type DomainEvent,
  type AlertContext,
  type SessionHistoryEntry,
  type OperatorTicketStats,
  type AlertHistory,
  type DailyReportInput,
  type DailyReport,
  type PaymentPlanError,
  type CashSessionError,
  type ConversionError,
} from './types';

export const DOMAIN_PACKAGE_NAME = '@tenu/domain';

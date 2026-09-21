import { arrondir, roundCashToUnit } from './rounding';
import { err, ok, type Result } from './types';
import type {
  DomainParameters,
  MoneyFcfa,
  PaymentItem,
  PaymentPlan,
  PaymentPlanError,
  PricedLine,
  SaleTotals,
} from './types';

export interface SaleComputation {
  readonly lines: readonly PricedLine[];
  readonly totals: SaleTotals;
}

/**
 * Ticket totals TTC/HT/VAT/discount/margin with HT allocation [BR5.1–BR5.2, RG-04–05].
 * Reconstructs lines by spread with `lineAmountHt` (WF4 / R-10).
 */
export function computeSaleTotals(
  pricedLines: readonly PricedLine[],
  params: DomainParameters,
): SaleComputation {
  if (pricedLines.length === 0) {
    throw new Error('computeSaleTotals: at least one line required');
  }

  let totalTtc = 0;
  let totalDiscount = 0;
  for (const line of pricedLines) {
    totalTtc += line.lineAmountTtc;
    totalDiscount += line.lineDiscount;
  }

  let totalHt: MoneyFcfa;
  let vatAmount: MoneyFcfa;
  if (params.vatApplicable) {
    const rate = params.vatRateBp ?? 0;
    totalHt = arrondir(totalTtc * 10_000, 10_000 + rate);
    vatAmount = totalTtc - totalHt;
  } else {
    totalHt = totalTtc;
    vatAmount = 0;
  }

  const linesWithHt: PricedLine[] = [];
  let allocatedHt = 0;
  let totalMargin = 0;

  for (let i = 0; i < pricedLines.length; i++) {
    const line = pricedLines[i];
    if (line === undefined) {
      continue;
    }

    let lineAmountHt: MoneyFcfa;
    if (i === pricedLines.length - 1) {
      lineAmountHt = totalHt - allocatedHt;
    } else if (totalTtc === 0) {
      lineAmountHt = 0;
    } else {
      lineAmountHt = arrondir(totalHt * line.lineAmountTtc, totalTtc);
      allocatedHt += lineAmountHt;
    }

    let lineCost = 0;
    if (line.quantityBase !== undefined && line.cumpAtSale !== undefined) {
      const absQty = Math.abs(line.quantityBase);
      lineCost = arrondir(absQty * line.cumpAtSale, 1_000_000);
    }
    const lineMargin = lineAmountHt - lineCost;
    totalMargin += lineMargin;

    linesWithHt.push({ ...line, lineAmountHt });
  }

  return {
    lines: linesWithHt,
    totals: {
      totalTtc,
      totalHt,
      vatAmount,
      totalDiscount,
      totalMargin,
      cashRoundingDelta: 0,
    },
  };
}

function sumByMode(payments: readonly PaymentItem[], mode: PaymentItem['mode']): MoneyFcfa {
  let sum = 0;
  for (const p of payments) {
    if (p.mode === mode) {
      sum += p.amount;
    }
  }
  return sum;
}

function sumAll(payments: readonly PaymentItem[]): MoneyFcfa {
  let sum = 0;
  for (const p of payments) {
    sum += p.amount;
  }
  return sum;
}

/**
 * Validate a payment plan [BR5.3, RG-06].
 * Credit counts toward coverage (Σ) but not toward the change ceiling (cash only).
 */
export function buildPaymentPlan(
  payments: readonly PaymentItem[],
  totalTtc: MoneyFcfa,
): Result<PaymentPlan, PaymentPlanError> {
  for (const p of payments) {
    if (p.amount < 1 || !Number.isInteger(p.amount)) {
      throw new Error('buildPaymentPlan: each payment amount must be an integer ≥ 1');
    }
  }

  const totalPaid = sumAll(payments);
  if (totalPaid < totalTtc) {
    return err('INSUFFICIENT_PAYMENT');
  }

  const changeDue = totalPaid - totalTtc;
  const cashTotal = sumByMode(payments, 'especes');
  if (changeDue > cashTotal) {
    return err('CHANGE_EXCEEDS_CASH');
  }

  return ok({
    payments,
    totalPaid,
    changeDue,
    netCash: cashTotal - changeDue,
  });
}

/**
 * Apply cash rounding to cash payment amounts only [BR1.2, RG-01].
 * Returns adjusted payments + delta for SaleTotals.cashRoundingDelta.
 */
export function applyCashRoundingToPayments(
  payments: readonly PaymentItem[],
  cashRoundingUnit: number,
): { readonly payments: PaymentItem[]; readonly cashRoundingDelta: MoneyFcfa } {
  let cashRoundingDelta = 0;
  const next: PaymentItem[] = payments.map((p) => {
    if (p.mode !== 'especes') {
      return p;
    }
    const { rounded, delta } = roundCashToUnit(p.amount, cashRoundingUnit);
    cashRoundingDelta += delta;
    return { ...p, amount: rounded };
  });
  return { payments: next, cashRoundingDelta };
}

/**
 * Full sale + payment pipeline with optional cash rounding [BR5.1–BR5.3].
 */
export function finalizeSale(
  pricedLines: readonly PricedLine[],
  payments: readonly PaymentItem[],
  params: DomainParameters,
): Result<
  { readonly sale: SaleComputation; readonly plan: PaymentPlan },
  PaymentPlanError
> {
  const { payments: roundedPayments, cashRoundingDelta } = applyCashRoundingToPayments(
    payments,
    params.cashRoundingUnit,
  );
  const sale = computeSaleTotals(pricedLines, params);
  const saleWithDelta: SaleComputation = {
    lines: sale.lines,
    totals: { ...sale.totals, cashRoundingDelta },
  };
  const plan = buildPaymentPlan(roundedPayments, saleWithDelta.totals.totalTtc);
  if (!plan.ok) {
    return plan;
  }
  return ok({ sale: saleWithDelta, plan: plan.value });
}

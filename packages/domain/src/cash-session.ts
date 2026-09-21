import { err, ok, type CashSessionError, type MoneyFcfa, type Result } from './types';
import type { SessionCashPosition } from './types';

export interface CashSessionInput {
  readonly initialFloat: MoneyFcfa;
  readonly netCashSales: MoneyFcfa;
  readonly cashInflows: MoneyFcfa;
  readonly cashOutflows: MoneyFcfa;
  readonly cashRefunds: MoneyFcfa;
  readonly countedCash: MoneyFcfa;
  readonly floatLeft: MoneyFcfa;
}

/** Theoretical cash = float + net sales + in − out − refunds [BR6.1, RG-20]. */
export function theoreticalCash(input: {
  readonly initialFloat: MoneyFcfa;
  readonly netCashSales: MoneyFcfa;
  readonly cashInflows: MoneyFcfa;
  readonly cashOutflows: MoneyFcfa;
  readonly cashRefunds: MoneyFcfa;
}): MoneyFcfa {
  return (
    input.initialFloat +
    input.netCashSales +
    input.cashInflows -
    input.cashOutflows -
    input.cashRefunds
  );
}

/**
 * Session cash position: variance and deposit [BR6.2, RG-21].
 * Rejects floatLeft outside [0, countedCash].
 */
export function computeSessionCashPosition(
  input: CashSessionInput,
): Result<SessionCashPosition, CashSessionError> {
  if (input.floatLeft < 0 || input.floatLeft > input.countedCash) {
    return err('FLOAT_LEFT_OUT_OF_BOUNDS');
  }

  const theoretical = theoreticalCash(input);
  const variance = input.countedCash - theoretical;
  const amountToDeposit = input.countedCash - input.floatLeft;

  return ok({
    theoreticalCash: theoretical,
    countedCash: input.countedCash,
    variance,
    amountToDeposit,
    floatLeft: input.floatLeft,
  });
}

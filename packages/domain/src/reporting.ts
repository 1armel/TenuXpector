import { tauxPour100Tickets } from './alert-engine';
import type { DailyReport, DailyReportInput, DomainParameters } from './types';

/**
 * Build a daily closing report from pre-aggregated data (no I/O) [BR8.1, EF-U1-10].
 */
export function rapportJournalier(
  input: DailyReportInput,
  params: DomainParameters,
): DailyReport {
  const report: DailyReport = {
    day: input.day,
    ticketCount: input.ticketCount,
    salesTtc: input.salesTtc,
    cashVarianceSummary: input.cashVarianceSummary,
    alertsSummary: input.alertsSummary,
  };

  if (input.operatorRates === undefined) {
    return report;
  }

  const rates: Record<
    string,
    {
      readonly ticketCount: number;
      readonly eventCount: number;
      readonly ratePer100: number | 'echantillon_insuffisant';
    }
  > = {};
  for (const [opId, stats] of Object.entries(input.operatorRates)) {
    const rate = tauxPour100Tickets(
      stats.eventCount,
      stats.ticketCount,
      params.alertThresholds.echantillonMin,
    );
    rates[opId] = {
      ticketCount: stats.ticketCount,
      eventCount: stats.eventCount,
      ratePer100: rate ?? 'echantillon_insuffisant',
    };
  }

  return { ...report, operatorRates: rates };
}

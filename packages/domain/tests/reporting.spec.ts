/**
 * Reporting [BR8.1, EF-U1-10].
 */
import { describe, expect, it } from 'vitest';
import { rapportJournalier } from '../src/reporting';
import { defaultParams } from './helpers';

describe('Reporting [BR8.1]', () => {
  it('builds DailyReport from aggregates', () => {
    const report = rapportJournalier(
      {
        day: '2026-09-20',
        ticketCount: 42,
        salesTtc: 150_000,
        cashVarianceSummary: { total: -500 },
        alertsSummary: { 'AL-01': 1 },
      },
      defaultParams,
    );
    expect(report.day).toBe('2026-09-20');
    expect(report.ticketCount).toBe(42);
    expect(report.salesTtc).toBe(150_000);
    expect(report.operatorRates).toBeUndefined();
  });

  it('marks operator rate as insufficient sample [RG-30]', () => {
    const report = rapportJournalier(
      {
        day: '2026-09-20',
        ticketCount: 10,
        salesTtc: 1000,
        cashVarianceSummary: {},
        alertsSummary: {},
        operatorRates: {
          'op-1': { ticketCount: 10, eventCount: 2 },
        },
      },
      defaultParams,
    );
    expect(report.operatorRates?.['op-1']?.ratePer100).toBe('echantillon_insuffisant');
  });

  it('computes rate when sample is sufficient', () => {
    const report = rapportJournalier(
      {
        day: '2026-09-20',
        ticketCount: 100,
        salesTtc: 1000,
        cashVarianceSummary: {},
        alertsSummary: {},
        operatorRates: {
          'op-1': { ticketCount: 100, eventCount: 5 },
        },
      },
      defaultParams,
    );
    expect(report.operatorRates?.['op-1']?.ratePer100).toBe(5);
  });
});

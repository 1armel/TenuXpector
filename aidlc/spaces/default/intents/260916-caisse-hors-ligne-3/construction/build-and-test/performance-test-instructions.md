# Performance Test Instructions

No `nfr-design` / `nfr-requirements` Construction artifacts exist for this intent yet. Measurable ENF from requirements:

| ID | Target | Local executable now? | Owning stage when deferred |
|---|---|---|---|
| ENF-01 | Vente 3 articles &lt; 20 s; UI &lt; 100 ms | No (needs caisse UI + Playwright timings) | performance-validation / u5 E2E |
| ENF-02 / 03 / 05 | Seed / volume performance | Partial (db seed tests exist; heavy load later) | performance-validation |
| ENF-16 | Playwright measures | When caisse E2E exists | performance-validation |

## Commands this stage

None required for a Met verdict on ENF-01..05 — record as **Unverified** with owning stage `performance-validation` (Operation skipped in this flow → remains Unverified until a later Construction validation or manual recipe).

## Optional local smoke (not a gate)

```bash
pnpm test:db   # seed/migration timing observable in logs only
```

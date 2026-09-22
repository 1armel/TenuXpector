<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

## Interpretations
- 2026-09-22T21:50:00Z — CD hors cloud : install manuelle Electron + migrations SQLite réversibles (infra Q1-A / CT-07).

## Interpretations
- 2026-09-22T21:55:00Z — Q1–Q4 = A : install manuelle, deux envs, rollback build+DB, pas de flags cloud.

## Tradeoffs
- 2026-09-22T22:05:00Z — CD = process manuel documenté (pas de workflow GitHub deploy) ; aligne CT-07 et HOLD phase-check.

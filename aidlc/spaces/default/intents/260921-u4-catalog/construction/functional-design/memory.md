<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-21T23:01:22Z — Q2-A: BR3.x numbered in functional-spec.md for kind ui (no separate rules.md); sensor-traceability advisory FAIL expected without requirements.md/rules.md.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-21T23:01:22Z — Full U4 spec (C1–C4) now vs C1-only; chose full so bolts share one behavioural source; code still starts at C1.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-21T23:01:22Z — R-01 categories seed-only vs UI create (C-02); resolve before category picker in C1. R-05 IPC mode duplicate vs UI pre-fill+create.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

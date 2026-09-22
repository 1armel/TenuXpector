<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-21T10:49:00Z — Performance ENF treated as N/A this pass; no NFR Construction artifacts and Operation stages are skipped, so local perf timings stay deferred until caisse UI + performance-validation exist.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-21T10:49:00Z — Skipped optional `pnpm test:e2e` and `pnpm test:resilience` for this early gate; Met targets (domain ≥90%, package ≥80%, typecheck/lint/forbidden-word) already green without them.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-21T10:49:00Z — Accepted early jump to Build and Test before u4+ Code Generation; cross-unit FR3–FR10 coverage stays PARTIAL by design until remaining units ship.
- 2026-09-21T10:49:00Z — Kept vendored `fast-check` / `pure-rand` tarballs in `vendor/` after npm outage during U3; prefer documenting offline install path over re-fetching mid-gate.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
- 2026-09-21T10:49:00Z — Whether to redo drifted `domain-design` / `units-generation` before CI Pipeline, or continue Construction with the advisory validity warning.

<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-22T06:13:03Z — nfr-requirements skipped: derived NFR3.1–NFR3.5 from ENF-02/08/16, CT-09, CR-02 for ui produces.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-22T06:13:03Z — No separate catalog auth (Q2-A); reuse caisse session + triple masking.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-22T06:13:03Z — Review minors R-01..R-04 (ENF-02 PC vs tablet wording, path sandbox for import paths, outbox wording) — address in infra/code C1 if needed.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

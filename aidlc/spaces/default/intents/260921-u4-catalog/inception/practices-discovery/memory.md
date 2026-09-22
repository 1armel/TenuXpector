<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-21T20:50:00Z — Relance : six questions seulement (écarts U4) ; branches, TDD domaine et livrable FR déjà affirmés dans team.md.
- 2026-09-21T20:50:00Z — ALWAYS « tout le schéma en anglais » recalé sur Q5 : identifiants nouveaux en anglais, tables déjà persistées gelées.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-21T20:50:00Z — E2e catalogue à J1 plutôt que bloquant à chaque fusion (Q3-A) : la porte de fusion reste typecheck/lint/test + couverture.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

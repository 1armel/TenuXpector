<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-17T17:05:50Z — Une cinquantaine de decisions proposees par le lead et les trois contributions, regroupees en 5 questions a option A recommandee, en application de la regle projet (ne poser que ce qui change ce qu on construit). Pas de question de choix de mode : presentation guidee directe, E et X accessibles par Other.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-17T17:05:50Z — Securite : .mcp.json (suivi par git) contient deux cles d API en clair dans la copie de travail, non commitees ; valeur Confluence affichee par erreur dans le journal de session local. Revocation recommandee au proprietaire.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

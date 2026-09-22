<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-21T13:05:56Z — Questions limitées à ce qui peut bloquer U4 (OCR/réseau, origine des photos, volume, format d'import) ; le périmètre FR3.1–FR3.8 n'est pas reposés.
- 2026-09-21T13:58:00Z — Verdict « faisable sous trois conditions » : l'OCR reste dans U4 mais n'est pas le chemin critique de la démo (clavier + import générique d'abord).

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-21T13:58:00Z — Pas d'évaluation AWS de comptes/régions : Q9-A et le métier hors ligne rendent un paysage cloud hors sujet pour cette unité.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-21T13:58:00Z — Q2-C (deux voies OCR) retenu plutôt que d'imposer le hors-ligne strict à la preuve de concept ; la vente reste hors ligne (R-05).


## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

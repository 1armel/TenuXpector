<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-17T21:57:53Z — Recherche web sur la facturation camerounaise (mentions obligatoires, numerotation continue sans trou, pas d obligation de format A4). Sources : guides specialises, pas le texte officiel du CGI ; consigne comme hypothese H2 a faire valider.
- 2026-09-17T21:17:55Z — Le document d exigences couvrant deja U0 a U6 en detail, les questions ne portent que sur ce qui manque (approvisionnement, credit, facture A4) et sur trois points laisses ouverts (service de reconnaissance, tablette en V1, ampleur de la mise a jour du document).
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-17T21:57:53Z — Mise a jour ciblee de docs/exigences-tenuxpector.md pendant cette etape (decidee en Q5 du perimetre et Q6 ici) : §1.2, §1.3, §11, sections U7/U8/U10, methodes de verification des ENF, glossaire §12. Le document n est pas un livrable declare de l etape.
- 2026-09-17T21:17:55Z — Pas de question de choix de mode : presentation guidee directe, en application de la regle projet sur le nombre de questions.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-17T21:57:53Z — OQ5 : une facture peut-elle porter plusieurs paiements dont un a credit ? A trancher a la conception fonctionnelle.
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

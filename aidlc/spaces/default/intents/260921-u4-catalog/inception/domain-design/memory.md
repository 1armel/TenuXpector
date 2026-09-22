<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->
- 2026-09-21T21:30:00Z — Q1–Q4 = A : Catalog + CatalogImport + CatalogCapture ; CatalogUi dans pc-proof ; TransactionalWriter ; SensitiveDataGuard inchangé.

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->
- 2026-09-21T21:30:00Z — Requirements/stories absents (skip) : catalogue dérivé du scope U4, EF-U2-* et du domain-design U3.

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->
- 2026-09-21T21:30:00Z — CatalogImport séparé de CatalogCapture pour isoler mapping fichier vs OCR réversible.

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-20T23:40:00Z — Q1-B = persister Category/Product/SellingUnit dans u2-foundation pour accélérer la livraison ; UI/import/recherche restent U4 ; pas de tables vente/stock.
- 2026-09-20T23:40:00Z — FR1.7 seed « 30 jours de ventes » interprété comme différé : seed U2 = tenant + 3 users + 200 articles ; ventes quand le schéma caisse existe.

## Deviations
- 2026-09-20T23:40:00Z — Catalogue schéma hors frontières strictes unit-of-work (composant Catalog = U4) ; choisi volontairement pour vitesse (réponse utilisateur Q1-B).

## Tradeoffs
- 2026-09-20T23:40:00Z — B plutôt que C : catalogue sans squelette ventes pour éviter contraintes append-only ventes trop tôt ; A aurait coûté une migration catalogue plus tard.

## Open questions
- 2026-09-20T23:40:00Z — Confirmer à U5 que le seed ventes (30 jours) sera ajouté dès que les tables ventes existent, pour fermer FR1.7 au complet.

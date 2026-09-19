<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-19T18:35:19Z — 14 unites : les 11 unites fonctionnelles du document plus les 3 unites dediees decidees en Q2 (empaquetage PC, empaquetage tablette, application proprietaire). Numerotation U1-U14 propre au plan, distincte des lots U0-U10 du document ; la correspondance est donnee unite par unite.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-19T18:35:19Z — Pas d histoires utilisateur (etape ecartee du plan) : la carte rattache les exigences FR plutot que des USx.y, conformement a la clause de repli de l etape.
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-19T18:35:19Z — Graphe verifie par script (noms, kinds, acyclicite) avant presentation, en application de la regle apprise a la conception du domaine.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

## 2026-09-19 — Relecture et corrections

- Itération 1 : verdict READY, trois réserves (R-01 partage de `Receipt` entre U6 et U11, R-02 dépendance u11←u10 non fondée, R-03 formulation d'ordre et justification u13←u12).
- R-01 et R-03 corrigés : U6 devient seul propriétaire du code d'impression et pose une interface de document ; U11 écrit `Invoice` derrière cette interface. La justification u13←u12 nomme ce qui est partagé et ce qui est refait par cible. La dernière phrase des chemins parallèles est reformulée en termes topologiques.
- R-02 : l'arête u11←u10 a été retirée et une section « Dépendances écartées » ajoutée. L'itération 2 a montré que cette justification contredit `components.md`, où `Invoice.customerId` référence le `Customer` de `Credit` (ligne 562). Vérifié à la main : `Customer` ne porte ni raison sociale ni NIU, donc l'amont ne peut pas servir FR10.3 tel quel. Point laissé ouvert et porté à la porte d'approbation : c'est un choix de modèle, pas une erreur de rédaction.
- Itération 2 : verdict READY, R-01 et R-03 `Resolved`, R-02 `Unresolved`, aucune régression structurelle. Graphe revérifié par `check-units.mjs` : 14 unités, 13 arêtes, acyclique ; mermaid et yaml comparés par script, 13 arêtes identiques de part et d'autre.

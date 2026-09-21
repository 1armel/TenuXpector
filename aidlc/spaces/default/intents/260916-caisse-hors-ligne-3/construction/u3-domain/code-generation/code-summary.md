# Résumé de génération — U3 Domaine (`u3-domain`)

## Livrable

Bibliothèque pure `@tenu/domain` : StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting, types DEC-04 et `arrondir` unique (RG-01).

## Méthode

Contract `sha256:b356a15826709b0d19108118b423cf247d3d5a7823a4cfe4e4519403234c67db` — methodology `custom`, tests d’abord pour les règles domaine. Couverture bloquante 90 % lignes + branches.

## Résultats de test

| Commande | Résultat |
|---|---|
| `pnpm test:domain` | 74 tests verts ; **98,24 % lignes**, **94,76 % branches** |
| `pnpm typecheck && pnpm lint && pnpm test` | Vert (pc-proof, db, domain) |

## Décisions appliquées

- BR5.3 : `credit` ∈ Σ pour `changeDue` ; plafond rendu = espèces seules (R-08 / R-11).
- `cash_outflow` n’émet pas AL-10 (R-09) ; AL-10 via `evaluerAlertesPeriodiques`.
- WF4 : lignes reconstruites par spread avec `lineAmountHt` ; Σ HT = totalHt (R-10).
- Dénominateur `arrondir` strictement positif (usages métier).

## Écarts

1. **Install fast-check** : registry npm inaccessible temporairement → tarballs vendored sous `vendor/` + `file:` dans `package.json` / lockfile. Comportement API inchangé.
2. **Cadence Red visible** : modules écrits en lots tests+implémentation ; la suite a bien échoué puis passé sur le cycle couverture/branches et sur `arrondir` (dénominateur négatif). Pas de Red file-par-file documenté pour chaque Étape 3–11 dans cette session.

## Hors scope respecté

Pas de SQLite/UI/réseau/outbox ; pas d’EF-U3-31 dans le domaine ; AL-12+ hors cœur non couvertes ; mot ENF-14 absent.

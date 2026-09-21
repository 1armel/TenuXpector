# Consignes de test — U3 Domaine (`u3-domain`)

Stratégie active : `Comprehensive`. Dix à quinze tests par composant. Cas nominal + ≥ 2 erreurs/limites. Aucun test qui passe quel que soit le code. Méthode `custom` : **tests d’abord** pour toutes les règles de `packages/domain`.

## Outillage

| Usage | Outil |
|---|---|
| Unitaire / croisement modules | Vitest (`vitest.config.ts` racine) |
| Propriétés (EF-U1-11) | `fast-check` — générateurs **entiers uniquement** (DEC-04) |
| Couverture | `@vitest/coverage-v8`, seuils **90 %** lignes et branches pour cette commande ; jamais abaissés |

Pas de Playwright E2E caisse dans cette unité (bibliothèque pure, pas d’écran). Les tests « intégration » = appels croisés StockLedger↔Costing, Pricing↔SaleCalculator, AlertEngine↔paramètres.

## Commande de l’unité (obligatoire avant le premier Red)

```bash
pnpm vitest run --dir packages/domain --coverage --coverage.include=packages/domain/src/**/*.ts --coverage.thresholds.lines=90 --coverage.thresholds.branches=90
```

Cette commande **DOIT** être exécutable dès l’étape 2 (suite vide ou smoke). Chaque cycle Red/Green de l’unité utilise cette commande (ou un filtre de fichier sous `packages/domain/tests/` en plus, jamais un `pnpm test` nu non scopé).

Filtre optionnel pendant un Red ciblé :

```bash
pnpm vitest run packages/domain/tests/stock-ledger.spec.ts
```

## Seuils

| Périmètre | Lignes | Branches |
|---|---|---|
| `packages/domain` (cette unité) | 90 % | 90 % |
| Autres paquets (ne pas régresser) | 80 % | 80 % |

Exclusions : `*.d.ts`, générés, `index.ts` de réexport si déjà exclu globalement — ne pas élargir les exclusions pour faire passer la couverture.

## Répartition attendue (≈ 10–15 tests / composant)

| Composant | Focus |
|---|---|
| rounding / types | demi vers le haut ; dénominateur 0 ; signes autorisés |
| StockLedger | somme ; filtre date ; conversion facteur < 1 refus ; Q négative OK |
| Costing | Q≤0 → c ; moyenne ; sortie inchangée ; valorisation ; CUMP ≥ 0 |
| Pricing | remise 0 ; sous plancher pb ; lineAmountTtc |
| SaleCalculator | TVA on/off ; dernière ligne HT ; paiement insuffisant ; rendu > espèces ; credit ∈ Σ hors plafond ; arrondi espèces |
| CashSession | RG-20/21 ; fond_laisse hors bornes |
| AlertEngine | chaque AL cœur catalogue + snapshot ; AL-09 sans blocage ; AL-10 non émis sur cash_outflow |
| Reporting | agrégats → DailyReport ; échantillon insuffisant RG-30 |
| properties | commutativité Q ; inverse ; CUMP ≥ 0 (fast-check) |

## Scénarios FD à couvrir

| ID | Attendu |
|---|---|
| S1 | Sortie Q=0 → Q négative, pas d’erreur domaine |
| S2 | Première entrée après Q < 0 → CUMP = coût d’entrée |
| S3 | TVA off → totalHt = totalTtc, vat = 0 |
| S4 | Mobile seul + rendu demandé → refus BR5.3 |
| S5 | Suite aléatoire + inverse → propriétés FR2.10 |

## Ce qu’un test ne doit pas faire

- Toucher SQLite, Electron, réseau, outbox, UI
- Utiliser des flottants pour montants / quantités / CUMP / taux
- Abaisser un seuil de couverture
- Contenir le mot interdit ENF-14
- Implémenter EF-U3-31 (ordre UI) dans le domaine

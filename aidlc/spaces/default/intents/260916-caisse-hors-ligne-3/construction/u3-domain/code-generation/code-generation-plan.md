# Plan de génération — U3 Domaine (`u3-domain`)

Unité : `u3-domain`, nature `library`. Correspondance document : U1 (exigences).
Entrées : `functional-spec.md`, `rules.md`, `entities.md`, `unit-of-work.md`, `requirements.md`, revue FD READY (R-01…R-10 résolus ; R-11 mineur wording PaymentPlan — appliquer BR5.3 canonique).

## Périmètre

Construire `@tenu/domain` : fonctions **pures** StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting, plus types DEC-04 et `arrondir` unique (RG-01).

**Frontière.** Aucune base, UI, réseau, outbox, schéma ou seed. Les appels viennent d’U5/U7/U9… Cette unité ne crée aucun écran. FR4.16 reste hors scope (UI → `u5-register`).

## Décisions reprises

| ID | Décision dans ce plan |
|---|---|
| Q1–Q5 FD | Entiers exclusifs DEC-04 ; quantité = somme mouvements ; stock négatif OK + AL-09 ; CUMP à chaque entrée y compris Q ≤ 0 ; sept composants |
| R-08 / BR5.3 | `credit` entre dans Σ pour `changeDue` ; plafond du rendu = Σ espèces seules |
| R-09 | `cash_outflow` alimente l’historique AL-10 ; pas d’émission directe sur l’événement |
| R-10 | WF4 reconstruit `PricedLine[]` par spread avec `lineAmountHt` ; Σ = totalHt |
| R-11 | Implémenter BR5.3 / PaymentItem (canonique) ; ne pas suivre la formulation ambiguë « exclu du calcul » de PaymentPlan l. 117 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "custom",
  "source": "team",
  "ordering": "Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.",
  "scope": "spec-driven-dual-target-ops",
  "test_strategy": "comprehensive",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: custom\n- **Ordering**: Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.\n- **Couverture bloquante** : `pnpm test` mesure la couverture et échoue sous 90 % des lignes et des branches dans `packages/domain` (ENF-11), et sous 80 % dans chacun des autres paquets. Les seuils sont déclarés dans la configuration et ne sont jamais abaissés pour faire passer une étape. Les exclusions (types, fichiers générés, migrations, seed) sont listées explicitement. [Q3]\n- **Outils** : Vitest pour les tests unitaires et d'intégration, fast-check pour les tests de propriétés (EF-U1-11, générateurs en entiers uniquement, DEC-04), Playwright pour les parcours de bout en bout sur Electron et les mesures ENF-01 et ENF-16. [Q3]\n- **Volume** : stratégie de test `Comprehensive`. Chaque fichier de test couvre le cas nominal et au moins deux cas d'erreur ou limites. Aucun test ne passe quel que soit le code. [état du flux, phases/construction.md]\n- **Parcours E2E obligatoire** : ouverture → vente → annulation → sortie d'espèces → clôture (ENF-11), sur Electron d'abord. La même suite sur Android viendra avec la tablette (I-02, ENF-15). [Q3, périmètre]\n- **Tests lourds avant chaque jalon** (J0 à J3) et avant l'installation : arrêts forcés pendant une série de ventes (ENF-04, ENF-17 : 10 pour J0, 100 en recette), performance sur seed volumineux (ENF-01, 02, 03, 05), propriétés à volume élevé. [Q3]\n- **Contrôles git versionnés**, installés automatiquement à l'installation des dépendances : [Q4]\n  - **avant chaque commit** : recherche de secrets sur les fichiers indexés (ENF-08) et contrôle du mot interdit (ENF-14) ;\n  - **avant chaque push** : `pnpm typecheck`, `pnpm lint`, `pnpm test` (avec la couverture bloquante) et audit des dépendances.\n- **Porte de fin de tâche** : chaque tâche se termine par `pnpm typecheck && pnpm lint && pnpm test`. Un Bolt ne fusionne pas sur `main` si l'une de ces commandes échoue. [CLAUDE.md]\n- **Contrôle ENF-14** : il vise les fichiers de code par une liste d'inclusion (`apps/`, `packages/`, fichiers de configuration à la racine). Le seul chemin exclu est le seed, désigné par son chemin exact. Le script ne contient pas le mot en clair et échoue si le périmètre inclus est vide. [Q4, contribution sécurité]\n- **Intégration continue** : une CI GitHub minimale (installation à dépendances figées, puis typecheck, lint, tests) est ajoutée avant l'installation en boutique. Les exigences qui demandent une « CI bloquante » (ENF-08, 10, 11, 14, 15) sont reformulées en conséquence pendant l'analyse des exigences. [Q4]"
    }
  ],
  "obligations": {
    "strategy": "comprehensive",
    "strategy_volume": [
      "Ten to fifteen tests per component.",
      "Unit, integration, and E2E tests.",
      "Add performance and security tests when NFRs demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "custom",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Custom ordering - Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.",
      "Implementation and tests - preserve that exact ordering; do not convert it to layer-local TDD.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:c9c1161dcf442aa972b4cb1cd9578d01cd86f8adc25f32bb7cc49a4a9e651de2",
  "contract_sha256": "sha256:b356a15826709b0d19108118b423cf247d3d5a7823a4cfe4e4519403234c67db"
}
```

**Lecture U3.** Méthode `custom` : **toutes** les règles de `packages/domain` s’écrivent **tests d’abord** (Red visible → Green → Refactor). Les quatre invariants hors domaine (append-only, outbox, ACL dashboard, clôture EF-U3-31) ne sont **pas** dans cette unité. Pas de couche UI ici. Couverture bloquante **90 % lignes et branches** sur `packages/domain` (ENF-11). Pas de Playwright E2E caisse (pas d’écran) ; propriétés fast-check (EF-U1-11) et tests croisés entre modules = couverture « intégration » de la stratégie.

## Étapes

### Structure et banc de test

- [x] **Étape 1 — Squelette `packages/domain`.** Modules kebab-case sous `src/` (`types`, `rounding`, `stock-ledger`, `costing`, `pricing`, `sale-calculator`, `cash-session`, `alert-engine`, `reporting`) ; exports publics depuis `index.ts` ; zéro import base/UI/réseau (ESLint existant). [BR9.1, FR2.10]
- [x] **Étape 2 — Banc de test unitaire.** Étendre Vitest pour `@tenu/domain` (alias, `coverage.include` domain, seuils **90 %** lignes/branches dédiés à la commande unitaire) ; ajouter `fast-check` ; enregistrer la commande exacte dans `unit-test-instructions.md`. Vérifier que la commande tourne (suite vide ou smoke) **avant** le premier Red. [ENF-11, plan_profile.runner]

### Règles métier — tests d’abord (Red → Green)

Pour chaque étape 3–11 : écrire les tests (cas nominal + ≥ 2 erreurs/limites) **vus échouer**, puis l’implémentation minimale, puis refactor en vert. Générateurs fast-check en **entiers uniquement** (DEC-04).

- [x] **Étape 3 — `arrondir` + types DEC-04.** `MoneyFcfa`, `QuantityBase`, `Cump`, `RateBp` ; `arrondir(numerateur, denominateur)` unique (plus proche, demi vers le haut). [BR1.1, BR1.2, RG-01, EF-U1]
- [x] **Étape 4 — StockLedger.** `quantiteStock`, `etatStockAu`, `versUniteBase` / inverse ; stock négatif autorisé (pas de refus). [BR2.1–BR2.4, RG-10, EF-U1-01, EF-U1-02, EF-U1-04, DEC-03]
- [x] **Étape 5 — Costing.** Recalcul CUMP (Q ≤ 0 → c ; sinon moyenne pondérée) ; sorties inchangées ; valorisation RG-12 ; retours/ajustements selon RG-11. [BR3.1–BR3.3, EF-U1-03]
- [x] **Étape 6 — Pricing.** Remise, sous plancher + `floorGapBp`, `lineAmountTtc` (RG-02…04). [BR4.1–BR4.2, EF-U1-05]
- [x] **Étape 7 — SaleCalculator.** Totaux TTC/HT/TVA/remise ; ventilation HT (dernière ligne) ; marges RG-05 ; plan paiements BR5.3 (refus insuffisant / rendu > espèces ; credit ∈ Σ, hors plafond rendu) ; arrondi espèces sur montant espèces seulement + `cashRoundingDelta`. [BR5.1–BR5.3, EF-U1-06, EF-U1-07, RG-04–06]
- [x] **Étape 8 — CashSession.** Espèces théoriques, écart, versement (bornes `floatLeft`). [BR6.1–BR6.2, EF-U1-08, RG-20, RG-21]
- [x] **Étape 9 — AlertEngine événementiel.** `evaluerAlertes` : AL-01…05, AL-08, AL-09, AL-16, AL-18 selon catalogue WF6 ; snapshot paramètres ; AL-09 n’implique aucun blocage. [BR7.1–BR7.2, EF-U1-09]
- [x] **Étape 10 — AlertEngine périodique.** `evaluerAlertesPeriodiques` : AL-06, AL-07, AL-10, AL-11 ; échantillon RG-30 / BR7.3 ; `cash_outflow` n’émet pas AL-10 directement. [BR7.1, BR7.3, EF-U1-09]
- [x] **Étape 11 — Reporting.** `rapportJournalier` → `DailyReport` (agrégats fournis, zéro I/O). [BR8.1, EF-U1-10]

### Propriétés et hygiène

- [x] **Étape 12 — Propriétés EF-U1-11 / FR2.10.** Suite aléatoire : quantité commutative (BR2.5) ; mouvement + inverse restaure Q ; CUMP ≥ 0 (BR3.2). Générateurs entiers. [EF-U1-11, BR2.5, BR3.2]
- [x] **Étape 13 — Couverture et porte.** `pnpm vitest run --dir packages/domain --coverage` ≥ 90 % lignes et branches ; `pnpm typecheck && pnpm lint && pnpm test` reste vert pour le monorepo (seuils db/pc-proof inchangés). Ne jamais abaisser un seuil. [ENF-11, BR9.1]
- [x] **Étape 14 — Traçabilité et résumé.** `code-summary.md`, `traceability.json`, `source-manifest.json` listant chaque fichier créé/modifié sous `packages/domain` et config test touchée.

## Emplacement du code

Sous `packages/domain/` (et config Vitest / deps racine si nécessaire) — **jamais** dans le dossier d’intent AI-DLC.

## Hors scope explicite

- Persistance, outbox, Identity, Settings UI, impression, sync, écrans caisse.
- AL-12…15, AL-17, AL-19, AL-21, AL-22 (canal/sync/UI — branchables plus tard si contexte fourni ; pas d’obligation de couverture complète ici hors catalogue FD cœur).
- FR4.16 (clavier) → `u5-register`.
- Ordre UI « comptage avant théorique » (EF-U3-31) → `u5-register` ; le domaine calcule le théorique seulement quand on le lui demande.

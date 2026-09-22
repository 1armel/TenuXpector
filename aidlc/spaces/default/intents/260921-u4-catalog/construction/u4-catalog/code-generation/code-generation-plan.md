# Plan de génération de code — U4 Catalogue · Bolt C1

> Squelette marchant (delivery-planning). Unité `u4-catalog`. FR3.1, FR3.2, CT-09 / BR3.17. Code commence ici ; C2–C4 après porte C1.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "custom",
  "source": "team",
  "ordering": "Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.",
  "scope": "spec-driven-dual-target-ops",
  "test_strategy": "comprehensive",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: custom\n- **Ordering**: Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.\n- **Règles catalogue** : code interne, plancher, recherche, désactivation et masquage des coûts sont des règles métier ; elles naissent tests d'abord dans `packages/domain`. Les tests de `packages/db` restent des tests de persistance et de schéma. [Q3, Q5]\n- **Couverture bloquante** : `pnpm test` enchaîne trois mesures indépendantes (`test:unit`, `test:db`, `test:domain`) et échoue sous 90 % des lignes et des branches dans `packages/domain` (ENF-11), et sous 80 % des lignes et des branches dans chacun des autres paquets. Les 80 % sont déclarés dans `vitest.config.ts` (fournisseur v8) ; les 90 % domain sont des drapeaux CLI du script `test:domain`, pas de `vitest.config.ts`. Ces seuils ne sont jamais abaissés pour faire passer une étape. Les exclusions (types, fichiers générés, migrations, seed, `doubles`, `index.ts`) sont listées explicitement. [Q3]\n- **Outils** : Vitest pour les tests unitaires et d'intégration ; fast-check pour les tests de propriétés (générateurs en entiers uniquement, DEC-04) ; Playwright pour les parcours de bout en bout sur Electron et les latences d'interface (actions ENF-01, ajout au ticket). ENF-16 (50 fiches minimales / 15 min) se chronomètre avec un opérateur à J1 (médiane de 3 essais) : Playwright ne le mesure pas. ENF-02 (recherche p95) se vise à J1. [Q3]\n- **Volume** : stratégie de test `Comprehensive`. Chaque fichier de test couvre le cas nominal et au moins deux cas d'erreur ou limites. Aucun test ne passe quel que soit le code.\n- **Parcours E2E** : le parcours caisse complet ouverture → vente → annulation → sortie d'espèces → clôture (ENF-11) reste une dette u3 ; il ne bloque pas la fusion d'un Bolt U4. Un parcours catalogue « créer / retrouver / masquer les coûts » est dû à J1, pas bloquant à chaque fusion. La même suite sur Android viendra avec la tablette (I-02, ENF-15). `pnpm test` et le `pre-push` ne lancent ni Playwright ni `test:resilience`. [Q3]\n- **Tests lourds avant chaque jalon** (J1 et J2 pour cette intention, et avant l'installation) : arrêts forcés, performance sur seed volumineux, propriétés à volume élevé, chronométrage ENF-16, perf recherche ENF-02. [Q3]\n- **Contrôles git versionnés**, installés automatiquement à l'installation des dépendances (`pnpm prepare` pointe `core.hooksPath` sur `.githooks/`) : [Q4]\n  - **avant chaque commit** : recherche de secrets sur les fichiers indexés (ENF-08) et contrôle du mot interdit (ENF-14) ;\n  - **avant chaque push** : `pnpm typecheck`, `pnpm lint`, `pnpm test` (avec la couverture bloquante) et `pnpm audit --audit-level=high`.\n  - Avant le premier Bolt U4, les scripts `.githooks/pre-commit` et `.githooks/pre-push` sont rendus exécutables (bit `+x` versionné) et on vérifie qu'ils partent vraiment sur ce PC Linux.\n- **Porte de fin de tâche** : chaque tâche se termine par `pnpm typecheck && pnpm lint && pnpm test`. Un Bolt ne fusionne pas sur `main` si l'une de ces commandes échoue. [CLAUDE.md]\n- **Contrôle ENF-14** : il vise les fichiers de code par une liste d'inclusion (`apps/`, `packages/`, `scripts/`, fichiers de configuration à la racine). Le seul chemin exclu est le seed, désigné par son chemin exact (`packages/db/src/seed/demo-seed.ts`). Le script ne contient pas le mot en clair et échoue si le périmètre inclus est vide.\n- **Intégration continue** : aucune CI GitHub n'existe encore. Une CI minimale (installation à dépendances figées, puis typecheck, lint, tests) reste due avant l'installation en boutique, posée par l'étape `ci-pipeline` de ce flux. Elle ne remplace pas les hooks locaux. [Q4]"
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
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
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
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Custom ordering - Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.",
      "Implementation and tests - preserve that exact ordering; do not convert it to layer-local TDD.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:0d660199af4df03b38ddd2a9aeeb540ed7957adaaab31eabc0ff081c0998e313",
  "contract_sha256": "sha256:c44bd79114cddc934449db5659efd16d2b601fd36006acc2fdbe5e70a4dce71c"
}
```
## Périmètre C1

| In | Out (C2+) |
|---|---|
| Création minimale 4 champs (BR3.9), plancher (BR3.2), code interne (BR3.1), unité base (BR3.3) | Saisie série, duplication, synonymes UI, suggestion 50 |
| Recherche accents (BR3.4) | Import / photo |
| Masquage vendeur (BR3.17) | Désactivation / étiquette |
| Persist + outbox atomique | OCR |
| Onglet Catalogue recherche + fiche | Articles à compléter |

Catégories : **seed / lecture seule** en C1 (R-01 FD) — pas d’UI de création.

## Steps

- [ ] Step 1 — Vérifier hooks `.githooks/pre-commit` et `pre-push` exécutables (`+x`) ; runner Vitest existant ; noter la commande unit-scopée (voir `unit-test-instructions.md`)
- [ ] Step 2 — **Domain Catalog (tests d’abord)** : fichiers sous `packages/domain/src/catalog/` — BR3.1, BR3.2, BR3.3, BR3.4, BR3.9, BR3.17 ; rouge → vert ; ≥ 10 tests ; export depuis `packages/domain/src/index.ts`
- [ ] Step 3 — **DB** : étendre `packages/db` (migration réversible si index recherche manquant) ; persistance Product/SellingUnit + `journal_audit` + `outbox` dans la même transaction via TransactionalWriter ; tests `packages/db` scopés catalogue
- [ ] Step 4 — **IPC** : canaux C-01 C1 (`catalog.search`, `catalog.getProduct`, `catalog.saveProduct`) Zod strict + SensitiveDataGuard ; tests contrat / handlers
- [ ] Step 5 — **UI** : `CatalogShell`, `CatalogSearch`, `CatalogResultList`, `ArticleForm`, `RoleGate` dans `apps/pc-proof` ; data-testid ; vendeur sans nœuds coûts ; tests renderer scopés
- [ ] Step 6 — Seed / démo : au moins un article vendable trouvé par la caisse existante
- [ ] Step 7 — `source-manifest.json` ; `code-summary.md` ; `traceability.json` (FR3.1/FR3.2 → chemins) ; `pnpm typecheck && pnpm lint && pnpm test` verts

## Trace FR → steps

| Exigence | Steps |
|---|---|
| FR3.1 Fiche | 2, 3, 4, 5 |
| FR3.2 Recherche | 2, 3, 4, 5 |
| CT-09 / BR3.17 | 2, 4, 5 |
| ENF-08 / outbox | 3 |
| NFR3.1 index | 3 |

## Hors C1

C2 clavier/désactivation/étiquette ; C3 import ; C4 photo — plans ultérieurs après porte squelette.

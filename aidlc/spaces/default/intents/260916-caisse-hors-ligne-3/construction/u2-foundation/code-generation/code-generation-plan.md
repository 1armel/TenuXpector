# Plan de génération — U2 Socle (`u2-foundation`)

Unité : `u2-foundation`, nature `library`. Correspondance document : U0.
Entrées : `functional-spec.md`, `rules.md`, `entities.md`, `unit-of-work.md`, `requirements.md`, revue FD READY (R-01…R-06).

## Périmètre

Construire Identity, Settings, TransactionalWriter, SensitiveDataGuard, le schéma/migrations (identité + paramètres + audit + outbox + catalogue **sans** quantités), et le seed démo (tenant, 3 users, 200 articles).

**Frontière.** Aucune règle de calcul stock/CUMP/totaux (U3). Aucun écran de vente ni import catalogue (U4/U5). Pas de tables ventes/mouvements stock. Pas de transport SyncEngine (U8).

## Décisions reprises de la revue FD (mineurs)

| ID | Décision dans ce plan |
|---|---|
| R-01 | `AuditEntry.recordedAt` = horodatage local ; `serverTimestamp` **différé à U8** (nullable ajouté par migration U8) |
| R-02 | `Tenant` / `Store` = singletons d’installation / seed ; contexte « tenant courant » injecté à TransactionalWriter (pas de composant runtime dédié) |
| R-03 | `PinAttempt` est **local appareil** : append sans `OutboxEvent` ; exception documentée à BR4.2 |
| R-04 | Clause annulation-vente de FR1.3 → U5 ; U2 couvre append-only `AuditEntry` / `PinAttempt` |
| R-05 | Révocation gérant → rôle cible **`vendeur`** |
| R-06 | Seed crée Settings **minimaux** (clés TVA/devise/arrondi/modes_paiement/mentions documentées dans Settings) ; le reste via défauts typés à la lecture |

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

**Lecture U2.** Méthode `custom` : tests d’abord pour append-only, outbox même TX, masquage vendeur ; le reste couche par couche puis tests. Pas de clôture EF-U3-31 ni contrôle d’accès API tableau de bord dans cette unité.

## Étapes

### Paquets et schéma

- [x] **Étape 1 — Paquets `packages/db` (ou équivalent) et migrations réversibles.** Tables Tenant, Store, User, PinAttempt, Setting, Category, Product, SellingUnit, AuditEntry, OutboxEvent. Métadonnées tenant/createdAt/createdBy/deviceId. Triggers/guards SQLite refusant UPDATE/DELETE sur AuditEntry et PinAttempt. [FR1.2, FR1.3, BR1.1–BR1.3]
- [x] **Étape 2 — UUID v7 côté client** à la création de toute entité. [FR1.5, BR1.4]
- [x] **Étape 3 — Isolation tenant** : toute API de lecture/écriture exige `tenantId` et filtre. Tests refus cross-tenant. [FR1.4, BR1.5]

### Identity

- [x] **Étape 4 — PIN PBKDF2-SHA256** (≥ 310 000 itérations, sel par user), vérif locale. Tests d’abord sur dérivation et comparaison. [FR1.6, BR2.1]
- [x] **Étape 5 — PinAttempt append + blocage 5/10 min** ; **sans** OutboxEvent (R-03). [BR2.2, BR2.3]
- [x] **Étape 6 — Assignation/révocation `gerant`** par propriétaire ; unique ; révocation → `vendeur` (R-05) ; AuditEntry + OutboxEvent via TransactionalWriter. [FR1.9, BR2.4]

### Settings et SensitiveDataGuard

- [x] **Étape 7 — Settings typés**, validation Zod à la lecture, défauts documentés, surcharge magasin. Aucune valeur métier en dur hors table défauts documentés. [FR1.8, BR3.1, BR3.2]
- [x] **Étape 8 — SensitiveDataGuard** retire prix d’achat, CUMP, marge, CA, valorisation pour `vendeur`. Tests d’abord. [BR5.1]

### TransactionalWriter et catalogue schéma

- [x] **Étape 9 — TransactionalWriter** : mutation + AuditEntry + OutboxEvent atomiques ; `localSequence` croissante ; test qui échoue si outbox manquante (hors PinAttempt). [FR4.8, FR6.1, FR7.1, BR4.1–BR4.3]
- [x] **Étape 10 — Contraintes Product/SellingUnit** : pas de quantité ; floor ≤ reference ; unité de base facteur 1000 ; désactivation `active=false`. [BR5.2–BR5.4]

### Seed et hygiène

- [x] **Étape 11 — Seed démo** : 1 tenant, 1 store, 3 users, Settings minimaux, ~200 Product + SellingUnit ; **pas** de ventes. [FR1.7, BR6.1]
- [x] **Étape 12 — Contrôle ENF-14** inchangé ; seed exclu par chemin exact. [BR6.2]
- [x] **Étape 13 — Traçabilité et résumé** : `code-summary.md`, `traceability.json`, `source-manifest.json`.

## Emplacement du code

Sous la racine du dépôt (`packages/…`, éventuellement adaptateurs dans `apps/pc-proof` ou `apps/caisse` partagé) — **jamais** dans le dossier d’intent AI-DLC.

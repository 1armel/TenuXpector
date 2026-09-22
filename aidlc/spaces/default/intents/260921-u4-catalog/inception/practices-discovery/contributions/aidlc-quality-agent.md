**Collaborator:** aidlc-quality-agent

## Contribution

Relance brownfield. La posture de `team.md` (Methodology `custom`, Ordering mixte, Comprehensive, seuils 90/80, hooks locaux) reste la bonne baseline pour U4. Le brouillon la recopie fidèlement. Les écarts ci-dessous sont des faits de dépôt que l’entretien doit trancher avant affirmation — pas de nouvelles règles `ALWAYS`/`NEVER`.

### Posture et cadence (aligné `team.md`)

- **Methodology `custom` + Ordering** : inchangés et applicables à U4. Les règles catalogue (code interne, plancher, recherche, désactivation, masquage des coûts) sont des règles métier → tests d’abord dans `packages/domain`, test rouge puis implémentation puis interface. Les adaptateurs (IPC, import fichier, photo) et l’UI restent couche par couche puis testés avant squash du Bolt.
- Le schéma produit vit déjà dans `packages/db` (`catalog/product.ts`, `product-schema.spec.ts`). Cela ne dispense pas le domaine : aujourd’hui `packages/domain` n’a ni module ni test de recherche, de code interne, de synonymes ou de fiche. `SensitiveDataGuard` (masquage vendeur, BR5.1) est testé dans `packages/db`, pas dans `domain`. Pour C1, l’entretien doit confirmer que les nouvelles règles catalogue (recherche, unicité du code interne, projection vendeur) naissent en TDD domaine, et que les tests db restent des tests de persistance / schéma.
- **Volume Comprehensive** : la consigne « nominal + au moins deux erreurs ou limites, aucun test tautologique » est respectée sur les fichiers domain inspectés (`stock-ledger`, `cash-session`, `reporting`, `properties`) et sur `product-schema` / `sensitive-data-guard`. À conserver telle quelle pour U4 ; l’import (C3) et la photo (C4) n’ont encore aucun fichier de test.

### Couverture et outillage (écarts vs le brouillon)

- Fournisseur **v8**, seuils **lignes et branches** : confirmé. `vitest.config.ts` pose **80 %** globalement. Le **90 % domain (ENF-11)** n’est **pas** dans `vitest.config.ts` : il n’existe que comme flags CLI de `pnpm test:domain`. Un `vitest run --dir packages/domain --coverage` hors script applique 80 %, pas 90 %. À corriger dans `team-practices.md` : « déclaré dans le script `test:domain` (et, si l’entretien le veut, figé dans une config domain) », pas « dans `vitest.config.ts` et le script ».
- `pnpm test` enchaîne `test:unit` → `test:db` → `test:domain`, chacun avec `--coverage` et le même `reportsDirectory: coverage`. Le fichier `coverage/coverage-summary.json` observé (~98 % lignes / ~95 % branches) est **uniquement domain** (dernier run). Ce n’est pas un agrégat monorepo. La porte fonctionne par **trois mesures indépendantes**, ce qui satisfait « 90 % domain et 80 % par paquet », mais il n’existe aucune preuve unique 80 % pc-proof + 80 % db. `test:unit` inclut aussi `src/**/*.ts` alors qu’il n’y a pas de `src/` à la racine — inoffensif, à retirer.
- Exclusions observées (`*.d.ts`, `generated`, `migrations.ts`, `seed`, `doubles`, `index.ts`, `tests`) : alignées au brouillon. Pas de seuil `functions` / `statements` ; `team.md` n’en demande pas.
- **fast-check** : générateurs entiers uniquement (`qtyArb` / `costArb`), 50 runs au quotidien. Conforme DEC-04. Le « volume élevé » reste un test lourd de jalon, pas un run de commit — le brouillon le dit correctement.
- **Playwright** (`tests/e2e/pc-proof.spec.ts`) : un parcours Electron « ouvrir → écrire → imprimer » plus un cas d’échec d’impression. **Sauté** si `apps/pc-proof/out/main/main.cjs` est absent (`test.skip`). Hors de `pnpm test` et du `pre-push`. Conforme à l’observation du lead (squelette U1, pas ENF-11 complet).
- **Résilience** : `test:resilience` (10 arrêts forcés, timeout 600 s) existe, hors `pnpm test`. Conforme « tests lourds avant jalon ».
- **Catalogue déjà testé (db, pas e2e)** : refus de quantité mutable, plancher ≤ prix de référence, unité de base obligatoire, persistance sans colonne quantité, désactivation `active=false`, masquage vendeur (prix d’achat, CUMP, marge, CA, valorisation). Seed démo = **200** produits. **Aucun** test ENF-16, **aucune** recherche, **aucun** e2e créer/retrouver/masquer.

### Portes qualité (CI, hooks, E2E)

- Pas de `.github/`. Pas de Husky. `prepare` pose `core.hooksPath=.githooks`. `pre-commit` : secrets + mot interdit (fichiers indexés). `pre-push` : `typecheck`, `lint`, `test` (couverture), `pnpm audit --audit-level=high`. `format:check` n’est pas dans la porte — hors périmètre qualité bloquant tant que l’entretien ne l’ajoute pas.
- Les deux hooks sont en mode **`644`** (pas exécutables) sur ce clone Linux. Avec `core.hooksPath`, Git **n’exécute pas** un hook sans bit `+x`. La porte « avant chaque push » décrite dans le brouillon n’est donc **pas vivante** ici ; seule la discipline `pnpm typecheck && pnpm lint && pnpm test` en fin de tâche l’est. L’entretien doit trancher : versionner le `+x` (`git update-index --chmod=+x`) comme pratique, ou admettre que la porte réelle est manuelle jusqu’à `ci-pipeline`.
- CI distante : d’accord avec le lead — due avant installation boutique, posée par l’étape `ci-pipeline` de ce flux, ne remplace pas les hooks. ENF-11/08/14 parlent d’une CI bloquante ; la reformulation « hooks maintenant, CI avant boutique » est déjà affirmée. Pas de nouvelle règle.
- Si C1 ajoute un e2e catalogue à la fusion : un `test.skip` sur binaire manquant ferait un vert silencieux. Un e2e **bloquant** doit **échouer** sans build Electron, ou rester hors `pnpm test` (jalon seulement).

### ENF à mesurer pour U4 (le brouillon mélange les méthodes)

Les exigences (§8) séparent les méthodes. Le brouillon les compacte trop :

| Code | Cible U4 | Méthode exigée | État dépôt |
|---|---|---|---|
| ENF-16 (50 fiches min. / 15 min) | C2 / J1 | Chronométrage opérateur sur cible réelle, médiane de 3 essais | Absent |
| ENF-16 (ajout ticket < 5 s) | U3, **hors U4** | Playwright | Hors intention |
| ENF-01 | Vente 3 articles < 20 s + latences UI | Chronométrage tablette (médiane de 10) **et** Playwright | Hors U4 (vente) ; Playwright squelette seulement |
| ENF-02 | Recherche p95 < 200 ms sur **10 000** articles | Perf sur cible ; seed actuel ~200 | Absent ; pertinent **C1** |
| ENF-11 E2E caisse | Ouverture → vente → annulation → sortie → clôture | Playwright Electron (puis Android) | Squelette U1 ; dette u3, d’accord |

Corriger le bullet **Outils** : Playwright sert les parcours e2e Electron et les **latences d’UI** (ENF-01 actions, ajout ticket). Il ne remplace pas le chronométrage opérateur de ENF-16 (50/15 min). Nommer **ENF-02** dans les tests lourds de J1 : C1 est la recherche.

### Écarts que l’entretien qualité doit résoudre

1. **E2E C1 bloquant à la fusion du Bolt, ou seulement à J1 ?** Créer / retrouver un article et masquer les coûts au vendeur : le brouillon propose « U4 l’étend au moins à… ». Trancher le caractère bloquant. Le parcours caisse ENF-11 complet ne doit pas bloquer U4 (dette u3) — d’accord avec le lead.
2. **ENF-16 à J1** : confirmer chronométrage opérateur (médiane de 3) comme preuve, éventuellement assisté d’un script de saisie ; ne pas exiger un e2e Playwright des 50 créations pour fusionner C1/C2.
3. **ENF-02 à J1** : seed de perf à 10 000 (aujourd’hui 200) et mesure p95 recherche — oui/non pour cette intention.
4. **Seuil 90 %** : le laisser en flags `test:domain`, ou le figer dans une config Vitest domain pour qu’on ne puisse pas le rater.
5. **Bit exécutable des hooks** : pratique à affirmer (fichiers `+x` versionnés) pour que la porte pré-push soit réelle sur Linux.
6. **Playwright skip** : skip hors jalon (actuel) vs échec sans binaire dès qu’un e2e U4 est dans la porte.
7. Stryker / mutation : hors U4, d’accord avec le lead (incertitude 11). Pas de couverture de fonctions/statements à ajouter.

### Intégration proposée dans `team-practices.md` (Testing Posture)

- Garder Methodology / Ordering / Comprehensive / 90-80 / v8 / fast-check entiers / hooks (intention) / porte de fin de tâche / CI différée.
- Remplacer la phrase des seuils : les 80 % sont dans `vitest.config.ts` ; les 90 % domain sont dans le script `test:domain` (flags CLI), jamais abaissés.
- Remplacer le bullet Outils : Vitest unit+intégration ; fast-check (entiers, DEC-04) ; Playwright e2e Electron et latences UI ; ENF-16 (50/15 min) = chronométrage opérateur à J1 ; ENF-02 = perf recherche à J1 si l’entretien le retient.
- Parcours e2e U4 : sous-parcours catalogue + masquage vendeur ; ENF-11 caisse complet reste une dette hors fusion U4.
- Mentionner que `pnpm test` ne lance ni Playwright ni la résilience (déjà dans `evidence.md`, à garder dans la pratique pour Code Generation).

## Positions

- AGREE: Methodology `custom` et Ordering (domaine + quatre invariants en TDD, adaptateurs/UI ensuite) — inchangés, et les règles catalogue U4 sont bien des règles métier à naître tests d’abord dans `packages/domain`.
- AGREE: Seuils bloquants 90 % domain / 80 % autres paquets (lignes et branches, v8, jamais abaissés), Comprehensive, fast-check entiers, hooks comme porte visée, CI distante plus tard via `ci-pipeline` — observés dans `package.json`, `vitest.config.ts` et `.githooks/`, cohérents avec `team.md`.
- AGREE: E2E ENF-11 caisse complet non bloquant pour fusionner U4 ; le squelette Playwright actuel (ouvrir/écrire/imprimer, skip sans build) et l’absence de CI GitHub sont correctement décrits.
- OBJECT: « Playwright … mesures ENF-01 et ENF-16 » — ENF-16 (50 créations / 15 min) se vérifie par chronométrage opérateur (médiane de 3) ; Playwright ne couvre que l’ajout au ticket (U3, hors U4), et ENF-02 (recherche p95 / 10 000) n’est pas nommé alors que C1 est la recherche.
- OBJECT: « Seuils déclarés dans `vitest.config.ts` et dans le script `test:domain` » plus portes git présentées comme vivantes — le 90 % n’est que CLI ; les trois runs écrasent `coverage/` ; les hooks sont `644` et Git ne les lance pas sur ce clone Linux.

**Collaborator:** aidlc-quality-agent

## Contribution

> Revue aveugle de la posture de test, de l'outillage de couverture, des portes qualité et des
> décisions à trancher. Sources : `CLAUDE.md` (racine), `docs/exigences-tenuxpector.md` §5 U1,
> §6, §8 (ENF-01 à ENF-17), `docs/specifications.md` (cadrage, ne fait pas foi),
> `ideation/scope-definition/scope-document.md`, brouillon du lead. Projet greenfield : tout ce
> qui suit est proposition à confirmer, sauf ce qui est cité d'une exigence.

### 1. Méthodologie et ordre — ajustements proposés à `## Testing Posture`

La méthodologie `custom` est juste : `CLAUDE.md` n'impose « tests d'abord » qu'aux règles métier de
`packages/domain`. Trois précisions rendent la ligne **Ordering** vérifiable par Build and Test :

1. **Ce que « tests d'abord » couvre dans `domain`** : pour chaque RG-xx et EF-U1-xx, un test à
   exemple chiffré (le §6 le demande : « couvertes par des tests avec exemples chiffrés ») écrit
   et vu rouge avant l'implémentation ; les tests de propriétés EF-U1-11 écrits dans le même Bolt que
   la fonction qu'ils ciblent, avant fusion.
2. **Invariants transverses hors `domain`** (proposition, à trancher) : quatre invariants de
   `CLAUDE.md` ne vivent pas dans `domain` mais sont les plus coûteux s'ils régressent. Je propose
   qu'ils soient eux aussi écrits **tests d'abord**, même dans les couches « test-after » :
   - append-only : un UPDATE/DELETE sur `mouvements_stock`, `mouvements_caisse`, `journal_audit`,
     `ouvertures_tiroir`, `lignes_vente`, `paiements` est refusé par la base ;
   - donnée **et** événement `outbox` dans la même transaction (échec → ni l'un ni l'autre) ;
   - contrôle d'accès du tableau de bord dans l'API : jeton `vendeur` → refus (test exigé par
     `CLAUDE.md`) ; un vendeur ne voit ni prix d'achat, ni CUMP, ni marge (§2.2) ;
   - clôture à l'aveugle EF-U3-31 : le théorique n'est pas rendu avant la saisie du comptage.
   Si l'humain accepte, la méthodologie reste `custom` et la phrase d'ordre devient : « Les règles
   métier de `packages/domain` et les invariants de données, d'accès et de clôture à l'aveugle
   s'écrivent tests d'abord ; les autres adaptateurs et l'interface sont implémentés couche par
   couche puis testés avant fusion. »
3. **Politique de défaut** : tout défaut trouvé (y compris un contre-exemple fast-check) reçoit
   d'abord un test de non-régression rouge, puis le correctif. À ajouter en puce.

### 2. Couverture — rendre ENF-11 réellement bloquant

- **ENF-11 n'est bloquant que si la commande de la porte échoue sous le seuil.** Aujourd'hui la
  porte est `pnpm typecheck && pnpm lint && pnpm test` ; si `pnpm test` ne mesure pas la couverture,
  ENF-11 n'est vérifié par rien. Proposition : `pnpm test` = `vitest run --coverage` sur le
  workspace, avec des **seuils déclarés par paquet** (`coverage.thresholds`) qui font échouer la
  commande. Pour `packages/domain` : `lines: 90`, `branches: 90` (ENF-11) ; je suggère aussi
  `functions: 90` et `statements: 90`, à confirmer.
- **Fournisseur de couverture** : `@vitest/coverage-v8` (défaut, rapide) ou `@vitest/coverage-istanbul`
  (comptage des branches plus conservateur sur les opérateurs `??`, `?.`, ternaires). Pour un seuil
  de branches à 90 % qui fait foi, le comptage doit être fixé une fois et ne plus bouger ; à trancher.
- **Exclusions listées explicitement** dans la configuration (types, index de réexport, fichiers
  générés, migrations, seed) et jamais élargies pour passer un seuil (`org.md` : un plancher ne peut
  pas être affaibli pour faire passer une étape).
- **Plancher hors `domain`** : le scope composé `spec-driven-dual-target-ops` n'est pas dans la liste
  des planchers de `org.md`, donc **aucun plancher n'est imposé par défaut** ; c'est une vraie
  décision. Un 80 % uniforme est irréaliste pour la coque Electron et les écrans, et sans valeur
  pour du code de câblage. Proposition différenciée :
  | Paquet | Plancher proposé | Pourquoi |
  |---|---|---|
  | `packages/domain` | 90 % lignes **et** branches | ENF-11, obligatoire |
  | `packages/sync`, `packages/db`, `apps/api` | 80 % lignes | logique d'outbox, migrations, contrôle d'accès |
  | `packages/shared` | 80 % lignes | formateurs ENF-07, schémas Zod |
  | `apps/caisse`, `apps/proprietaire` | pas de seuil chiffré | couverts par tests de composants ciblés + E2E |
- **Couverture ≠ qualité des assertions.** Pour du calcul d'argent, je propose en option un test
  de mutation **Stryker** sur `packages/domain` avant chaque jalon (non bloquant au départ, score
  suivi). À trancher : oui / non / plus tard.

### 3. Tests de propriétés EF-U1-11

- Outil : **fast-check** avec `@fast-check/vitest` (s'exécute dans la même suite, compte dans la
  couverture). Absent des exigences et du cadrage : à confirmer.
- **Générateurs en entiers uniquement** (DEC-04) : quantités en millièmes, coûts en millièmes de
  FCFA, montants en FCFA ; aucun `fc.float`/`fc.double`. Générateurs partagés dans un module de
  test de `domain` (pas dans le code livré).
- Propriétés exigées (EF-U1-11) : quantité indépendante de l'ordre d'insertion (**la quantité
  seulement** : le CUMP RG-11 dépend de l'ordre, le test ne doit pas l'affirmer) ; mouvement +
  inverse → quantité initiale ; CUMP ≥ 0.
- Propriétés supplémentaires à faible coût, proposées : `arrondir` demi vers le haut et borné (RG-01) ;
  `Σ ht_ligne = total_ht` exactement (RG-04) ; `montant_tva = total_ttc − total_ht` ;
  validation refusée si rendu > espèces (RG-06) ; `montant_verse + fond_laisse = especes_comptees`
  (RG-21) ; conversion d'unités aller-retour sans perte (EF-U1-04).
- **Reproductibilité** : graine affichée à chaque échec, rejouable ; tout contre-exemple trouvé est
  figé en test à exemple (politique de défaut). **Volume** : `numRuns` par défaut (100) dans la porte
  avant fusion, volume élevé (par ex. 10 000) avant jalon. Valeurs à confirmer.
- Déterminisme de `domain` : horloge et générateur d'UUID v7 **injectés** en paramètre, jamais lus
  en global, sinon les tests de dates (EF-U1-02, AL-17 horaires) et d'identifiants deviennent
  instables. Tests de formateurs ENF-07 exécutés avec un `TZ` de processus différent de
  `Africa/Douala` pour prouver que le fuseau vient du code, pas de la machine.

### 4. Carte des niveaux de test par couche (proposition intégrable)

| Couche | Type | Outil proposé | Points clés |
|---|---|---|---|
| `packages/domain` | unitaire + propriétés | Vitest, fast-check | exemples chiffrés §6, AL-xx §7 par règle, tests d'abord |
| `packages/db` | intégration sur **vraie** SQLite chiffrée | Vitest | migrations `up` puis `down` réversibles (EF-U0-02), refus UPDATE/DELETE append-only, filtre `tenant_id`, pas de mock de la base |
| `packages/sync` | intégration avec transport factice | Vitest | coupure aléatoire du transport pendant une série de ventes (cadrage) ; l'application fonctionne sans transport |
| `apps/api` | intégration / contrat | Vitest + schémas Zod partagés | refus du tableau de bord à un rôle non `proprietaire` ; jetons révocables (ENF-08) ; logs sans PIN, prix d'achat ni jeton (ENF-08) |
| `apps/caisse` | composants | Vitest + Testing Library | EF-U3-31 aveugle, masquage §2.2 côté vendeur, clavier seul EF-U3-17 |
| Parcours | E2E | Playwright (lancement Electron) | parcours ENF-11 ; ENF-01 et ENF-16 mesurés ; contraste ENF-06 |
| Sauvegarde | intégration | Vitest | ENF-10 : export chiffré → restauration → comparaison, sur petit seed, à chaque fusion |
| Robustesse | banc scripté | script Node | ENF-04 / ENF-17 : arrêts forcés du processus pendant une série de ventes |
| Performance | banc | Playwright / script | ENF-01/02/03/05 sur seed volumineux |

Remarques techniques à porter dans `evidence.md` :

- **Playwright + Electron** passe par l'API `_electron`, marquée expérimentale ; acceptable, mais le
  module SQLCipher natif doit être compilé pour la version d'Electron utilisée par les tests.
- **ENF-06 contraste 7:1** : c'est la règle axe-core `color-contrast-enhanced` (niveau AAA),
  **désactivée par défaut** dans `@axe-core/playwright` ; il faut l'activer explicitement, sinon le
  contrôle vérifie 4,5:1 et passe à tort.
- **ENF-04 / ENF-17 : tuer le processus n'est pas couper le courant.** Un `kill` prouve la
  durabilité face à un crash applicatif (journal SQLite, transactions), pas face à une perte des
  écritures non vidées par le système. Proposition : banc automatisé d'arrêts forcés du processus
  (10 pour J0, 100 pour la recette) **plus** un protocole manuel court de coupure physique réelle
  (débrancher le PC sans onduleur, N fois, N à fixer) consigné avant installation. Vérifier aussi
  la restauration du panier en cours (ENF-17), pas seulement l'absence de perte de vente validée.
- **ENF-15 parité Android** : Playwright ne pilote pas une application Capacitor sur Android comme
  il pilote Electron. « Même suite E2E » exigera soit un autre pilote (WebdriverIO/Appium), soit une
  exécution de la WebView via le protocole de débogage Chrome. Report légitime (I-02), mais écrire
  dès U3 les E2E derrière une couche d'objets de page indépendante de la cible, pour ne pas les
  réécrire plus tard.
- **Performance sans tablette** : ENF-01/02/03 sont définies « sur la tablette cible ». Tant que le
  PC est seul, il faut fixer une **machine de référence** (le PC de la boutique ou un équivalent bas
  de gamme) et dire si les mêmes seuils s'y appliquent.
- **Données de test** : fabriques typées par entité (identifiants UUID v7 via générateur injecté),
  chaque test prépare ses données ; le seed de démonstration versionné sert à la fois à l'E2E, à la
  performance (variante volumineuse : 10 000 articles, 30 000 ventes pour ENF-05) et à la
  répétition d'installation ENF-13.
- **Tests instables** : `retries: 0` dans la porte ; un test instable est un défaut, pas une
  relance. Le test de la phase `construction.md` (« nominal + au moins deux cas d'erreur ou
  limites ») s'applique par fichier ; pour les fichiers de propriétés et d'E2E, l'appliquer au
  niveau du comportement testé.
- **Traçabilité** : noms de `describe` préfixés par l'identifiant (`RG-11 — CUMP`, `EF-U3-31 — …`) ;
  un script simple peut vérifier que chaque RG-xx et EF-U1-xx cité au §5/§6 apparaît dans au moins
  un fichier de test de `domain`.

### 5. Portes qualité réalistes pour un développeur seul

Deux niveaux, pour que la porte avant fusion reste rapide (objectif proposé : moins de 5 minutes)
sans laisser de côté les ENF lourdes :

**Niveau 1 — avant chaque fusion de Bolt sur `main`** (porte `CLAUDE.md`) :
1. `pnpm typecheck` (strict, aucun `any`) ;
2. `pnpm lint` (ESLint + contrôle du mot interdit ENF-14 sur `packages/` et `apps/`, seed exclu ;
   recherche de secrets ENF-08 si l'outil retenu est assez rapide — outil du ressort de devsecops) ;
3. `pnpm test` : unitaires, propriétés (volume par défaut), intégration base/sync/api, sauvegarde →
   restauration ENF-10, **avec seuils de couverture bloquants** ;
4. à partir de U3 : `pnpm test:e2e` sur Electron, parcours ENF-11 seulement (à trancher : dans la
   porte à chaque fusion, ou seulement pour les Bolts qui touchent `apps/caisse`).

**Niveau 2 — avant chaque jalon (J0 à J3) et avant l'installation** :
`pnpm test:e2e` complet, `pnpm test:robustesse` (arrêts forcés : 10 pour J0, 100 en recette),
`pnpm test:perf` (ENF-01/02/03/05 sur seed volumineux), propriétés à volume élevé, mutation si
retenue, coupures physiques manuelles, ENF-09 et ENF-13 mesurés. Résultats consignés
(cible / mesuré / verdict) dans la matrice NFR du jalon.

### 6. Tension T1 — « CI bloquante » contre porte locale

ENF-08, ENF-10, ENF-11, ENF-14 et ENF-15 disent « en CI » ou « CI bloquante » ; `ci-pipeline` est en
SKIP. Une porte locale n'est « bloquante » que si rien ne permet de fusionner sans la passer ; or
une commande qu'on lance à la main s'oublie, et un hook git se contourne (`--no-verify`). Options à
présenter telles quelles :

- **A. CI minimale GitHub Actions** exécutant le niveau 1 à chaque push sur `main` et sur les pull
  requests, runner **Windows** (module SQLCipher natif et Electron) ; bloquante seulement avec une
  protection de branche, donc avec fusion par pull request. Coût : temps de mise en place en U0 et
  minutes de runner (les minutes Windows comptent double sur un dépôt privé). Implique de réactiver
  `ci-pipeline` ou de l'inclure dans U0 (changement de scope, `change_control: strict`).
- **B. Porte locale imposée mécaniquement** : hook `pre-push` (lefthook ou simple-git-hooks) qui
  lance le niveau 1, **et** reformulation de ENF-08/10/11/14/15 pendant l'analyse des exigences
  (« porte bloquante avant fusion » au lieu de « CI »), comme pour I-01 à I-03.
- **C. B maintenant, A avant l'installation en boutique** (J3), quand le code est stable et que la
  vente à d'autres commerces rend la reproductibilité indépendante du PC du développeur plus utile.

Recommandation qualité : **C**. Ce qui ne doit pas arriver : garder « CI bloquante » dans un document
qui fait foi alors qu'aucune CI n'existe — Build and Test ne pourrait alors ni vérifier ni lever ces
exigences.

### 7. Décisions exactes à soumettre à l'humain (Testing Posture)

Formulées pour remplacer ou préciser les questions 8 à 13 du lead :

1. **Tests d'abord** : (a) règles de `domain` seulement ; (b) `domain` + invariants append-only,
   outbox transactionnelle, accès du tableau de bord et clôture à l'aveugle ; (c) toutes les couches
   (`tdd`).
2. **Défauts** : chaque défaut commence-t-il par un test de non-régression rouge ? (oui / non)
3. **Seuils hors `domain`** : tableau différencié du §2, 80 % partout, ou aucun seuil ?
4. **Mesure de couverture** : `domain` à 90 % lignes et branches seulement (ENF-11), ou aussi fonctions
   et instructions ; fournisseur v8 ou istanbul ?
5. **Outils** : Vitest, `@vitest/coverage-*`, fast-check, Testing Library, Playwright (Electron),
   `@axe-core/playwright` — confirmer ou remplacer.
6. **Contenu de `pnpm test`** : couverture bloquante incluse (recommandé) ; E2E dans la porte à chaque
   fusion, ou seulement pour les Bolts qui touchent la caisse ?
7. **CI (T1)** : option A, B ou C du §6 ; et, si B ou C, hook `pre-push` ou `pre-commit` ?
8. **Tests lourds** (arrêts forcés, performance, propriétés à volume élevé, mutation) : avant chaque
   jalon seulement, ou aussi à la fusion de certains Bolts (base, sync) ?
9. **Machine de référence** pour ENF-01/02/03 tant que la tablette n'existe pas, et seuils applicables.
10. **Coupure physique réelle** : combien d'essais manuels avant installation ?
11. **Mutation (Stryker) sur `domain`** : avant jalon non bloquante, bloquante avec un score, ou non ?
12. **ENF-15** : accepter de reformuler la parité Android comme exigence différée (avec la tablette),
    E2E écrits dès maintenant indépendants de la cible ?

## Positions

- AGREE: Méthodologie `custom` (tests d'abord pour `packages/domain`, test-after ailleurs) — c'est exactement ce que `CLAUDE.md` énonce ; `tdd` partout serait une extrapolation non affirmée.
- AGREE: Couverture `packages/domain` ≥ 90 % lignes et branches en règle `Mandated` — ENF-11 est une exigence d'un document qui fait foi, pas une pratique révisable.
- OBJECT: La phrase **Ordering** et la porte avant fusion ne disent pas que `pnpm test` fait échouer la commande sous le seuil de couverture — sans seuils déclarés et bloquants dans la configuration Vitest, ENF-11 n'est vérifié par aucune porte.
- OBJECT: « Pas d'étape CI ; la porte locale en tient lieu » laissé en l'état — une commande manuelle n'est pas « bloquante » ; il faut soit une imposition mécanique (hook) plus la reformulation de ENF-08/10/11/14/15, soit une CI minimale (options A/B/C, §6).
- OBJECT: Plancher de 80 % des lignes proposé uniformément pour « les autres paquets » en tant que suggestion `org.md` — le scope composé n'est pas dans la liste des planchers d'`org.md`, et 80 % sur la coque Electron et les écrans pousse à des tests sans valeur ; plancher différencié par paquet proposé.
- AGREE: E2E sur Electron d'abord, Android avec la tablette — cohérent avec I-02 ; à condition d'écrire les E2E derrière des objets de page indépendants de la cible, car Playwright ne réutilisera pas tel quel la suite sur Capacitor/Android (ENF-15).
- AGREE: Tests de robustesse ENF-04/ENF-17 (10 arrêts pour J0, 100 en recette) — en précisant qu'un arrêt forcé du processus ne simule pas une coupure de courant ; un protocole manuel de coupure physique et la vérification de la restauration du panier sont à ajouter.
- AGREE: Vitest et Playwright comme outils — cités par le cadrage et par ENF-01/ENF-16 ; à compléter par fast-check pour EF-U1-11 et axe-core avec la règle AAA activée pour ENF-06.
- AGREE: Contrôle ENF-14 rattaché à `pnpm lint`, périmètre limité au code (`packages/`, `apps/`) hors seed — cela résout aussi T4 sans exclure la règle écrite dans `aidlc/` et `docs/`.
- AGREE: Séparer une porte rapide avant fusion et une porte lourde avant jalon (question 13 du lead) — seule façon réaliste pour un développeur seul de tenir la stratégie `Comprehensive` sans ralentir chaque fusion.

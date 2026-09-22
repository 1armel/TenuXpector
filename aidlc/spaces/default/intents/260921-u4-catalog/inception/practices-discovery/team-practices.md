# Pratiques de l'équipe — TenuXpector (U4 Catalogue)

> Pratiques intégrées après l'entretien (Q1 à Q6, résumé consolidé confirmé
> « Looks correct »), à partir du brouillon lead et des contributions qualité,
> développeur et sécurité. Relance brownfield : les cinq sections de
> `aidlc/spaces/default/memory/team.md` (affirmées le 2026-09-17) restent la
> baseline. Détail des sources et des arbitrages : `evidence.md`.

## Way of Working

- Nous travaillons en trunk-based : `main` est la seule branche longue. Les worktrees de Construction partent de `main` et fusionnent sur `main`. [Q1]
- Nous ouvrons une branche courte par Bolt, c'est-à-dire par tranche de travail de quelques jours au plus. Une unité entière est découpée en plusieurs Bolts, ce que permet la règle « une unité ou fonctionnalité par branche » de `CLAUDE.md`. Pour U4, les tranches du carnet (C1 à C4) sont les Bolts naturels. [Q1]
- Nous fusionnons chaque Bolt sur `main` par squash : un Bolt donne un commit sur `main`. Les commits intermédiaires de la branche sont libres. [Q1]
- Nous fusionnons en local, sans pull request, puis nous poussons `main` sur `origin`. Le contrôle avant fusion est assuré par les hooks git versionnés décrits sous `## Testing Posture`. [Q1, Q4]
- Le commit de squash sur `main` suit Conventional Commits et cite les identifiants d'exigence, par exemple `feat(caisse): catalog search [EF-U2-02]`. [Q1, CLAUDE.md]
- Les plans, les tests et les commits citent les identifiants EF-, RG-, AL-, ENF-, DEC-. [CLAUDE.md]
- Chaque décision d'architecture donne lieu à un ADR dans `docs/adr/`. Les ADR 001 à 003 existent déjà (moteur chiffré, impression thermique, version Electron). Tout nouveau module natif, tout adaptateur de reconnaissance d'image, et tout changement de schéma catalogue ont leur ADR. [CLAUDE.md]
- Quand une question ouverte (Q-xx) bloque une tâche, nous la posons au lieu de supposer. Quand une demande contredit un invariant, nous le signalons au lieu de contourner. [CLAUDE.md]

## Walking Skeleton

- Le socle P0 / U1 à U3 est déjà livré : coquille Electron durcie, base locale chiffrée, impression USB, survie à la coupure, identité, paramètres, et règles métier dans `packages/domain`. On ne reconstruit pas une coquille. Ce code reste la base de U4. [Q2]
- Nous construisons d'abord une tranche minimale de bout en bout. Pour U4, ce premier Bolt est **C1** : une fiche article créée par le propriétaire ou le gérant, retrouvable, et masquée des coûts pour le vendeur, dans l'application de caisse déjà livrée (`apps/pc-proof`). Ce n'est pas la photo du registre. [Q2]
- C1 s'exécute seul, et nous l'approuvons explicitement avant les Bolts suivants (C2 saisie clavier, C3 import, C4 photo). Ensuite, nous choisissons comment enchaîner les Bolts restants : en autonomie, ou avec une porte à chaque Bolt. Le scope actif déclare `skeleton: on`. [Q2]
- Nous construisons hors boutique avec les données de démonstration, puis nous installons en une fois. La saisie du registre réel n'est pas dans cette intention.

## Testing Posture

- **Methodology**: custom
- **Ordering**: Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.
- **Règles catalogue** : code interne, plancher, recherche, désactivation et masquage des coûts sont des règles métier ; elles naissent tests d'abord dans `packages/domain`. Les tests de `packages/db` restent des tests de persistance et de schéma. [Q3, Q5]
- **Couverture bloquante** : `pnpm test` enchaîne trois mesures indépendantes (`test:unit`, `test:db`, `test:domain`) et échoue sous 90 % des lignes et des branches dans `packages/domain` (ENF-11), et sous 80 % des lignes et des branches dans chacun des autres paquets. Les 80 % sont déclarés dans `vitest.config.ts` (fournisseur v8) ; les 90 % domain sont des drapeaux CLI du script `test:domain`, pas de `vitest.config.ts`. Ces seuils ne sont jamais abaissés pour faire passer une étape. Les exclusions (types, fichiers générés, migrations, seed, `doubles`, `index.ts`) sont listées explicitement. [Q3]
- **Outils** : Vitest pour les tests unitaires et d'intégration ; fast-check pour les tests de propriétés (générateurs en entiers uniquement, DEC-04) ; Playwright pour les parcours de bout en bout sur Electron et les latences d'interface (actions ENF-01, ajout au ticket). ENF-16 (50 fiches minimales / 15 min) se chronomètre avec un opérateur à J1 (médiane de 3 essais) : Playwright ne le mesure pas. ENF-02 (recherche p95) se vise à J1. [Q3]
- **Volume** : stratégie de test `Comprehensive`. Chaque fichier de test couvre le cas nominal et au moins deux cas d'erreur ou limites. Aucun test ne passe quel que soit le code.
- **Parcours E2E** : le parcours caisse complet ouverture → vente → annulation → sortie d'espèces → clôture (ENF-11) reste une dette u3 ; il ne bloque pas la fusion d'un Bolt U4. Un parcours catalogue « créer / retrouver / masquer les coûts » est dû à J1, pas bloquant à chaque fusion. La même suite sur Android viendra avec la tablette (I-02, ENF-15). `pnpm test` et le `pre-push` ne lancent ni Playwright ni `test:resilience`. [Q3]
- **Tests lourds avant chaque jalon** (J1 et J2 pour cette intention, et avant l'installation) : arrêts forcés, performance sur seed volumineux, propriétés à volume élevé, chronométrage ENF-16, perf recherche ENF-02. [Q3]
- **Contrôles git versionnés**, installés automatiquement à l'installation des dépendances (`pnpm prepare` pointe `core.hooksPath` sur `.githooks/`) : [Q4]
  - **avant chaque commit** : recherche de secrets sur les fichiers indexés (ENF-08) et contrôle du mot interdit (ENF-14) ;
  - **avant chaque push** : `pnpm typecheck`, `pnpm lint`, `pnpm test` (avec la couverture bloquante) et `pnpm audit --audit-level=high`.
  - Avant le premier Bolt U4, les scripts `.githooks/pre-commit` et `.githooks/pre-push` sont rendus exécutables (bit `+x` versionné) et on vérifie qu'ils partent vraiment sur ce PC Linux.
- **Porte de fin de tâche** : chaque tâche se termine par `pnpm typecheck && pnpm lint && pnpm test`. Un Bolt ne fusionne pas sur `main` si l'une de ces commandes échoue. [CLAUDE.md]
- **Contrôle ENF-14** : il vise les fichiers de code par une liste d'inclusion (`apps/`, `packages/`, `scripts/`, fichiers de configuration à la racine). Le seul chemin exclu est le seed, désigné par son chemin exact (`packages/db/src/seed/demo-seed.ts`). Le script ne contient pas le mot en clair et échoue si le périmètre inclus est vide.
- **Intégration continue** : aucune CI GitHub n'existe encore. Une CI minimale (installation à dépendances figées, puis typecheck, lint, tests) reste due avant l'installation en boutique, posée par l'étape `ci-pipeline` de ce flux. Elle ne remplace pas les hooks locaux. [Q4]

## Deployment

- Nous ne déployons pas automatiquement à la fusion, et nous n'avons pas d'environnement de préproduction. U4 ne change pas cela : pas de serveur, pas de compte AWS, pas d'application propriétaire dans cette intention.
- Nous livrons en une fois. La V1 (dont U4) est construite et testée hors boutique sur les données de démonstration, puis installée en boutique en une seule fois. La saisie du registre réel suit dans les semaines suivantes.
- Chaque version installable est identifiée par une étiquette git sur `main`, posée sur un commit dont tous les contrôles sont verts. Aucune étiquette n'existe encore.
- Nous construisons l'installateur Windows d'Electron à la main. L'application livrée reste `apps/pc-proof` (caisse), enrichie du catalogue. [Q5]
- Le serveur de synchronisation (U6) reste hors de U4. S'il est déployé plus tard, ce sera à la main, avec une procédure écrite de retour arrière. Ses secrets restent hors du dépôt.
- Installation chez un client en moins d'une heure, import compris. Sur poste fixe, l'onduleur est une exigence d'installation documentée.
- Ce flux compile les étapes Operation (`deployment-pipeline`, `environment-provisioning`, `deployment-execution`, `performance-validation`). Elles décrivent le même chemin manuel (étiquette, installateur, recette hors boutique) ; elles n'introduisent ni AWS ni déploiement continu vers la production.

## Code Style

- **Langue du code** : les identifiants **nouveaux** sont en anglais (fonctions, types, canaux IPC, clés de paramètres). Les noms de tables et colonnes déjà persistés ne se renomment pas dans U4. Les littéraux déjà en base (rôles `vendeur` | `gerant` | `proprietaire`, kinds de mouvement, moyens de paiement) restent gelés ; le refactor des identifiants français existants dans `packages/domain` (`quantiteStock`, `ENTREE_ACHAT`, `especes`) est hors U4. [Q5]
- **Langue du livrable** : tout ce que voient les utilisateurs est en français (interface, tickets, rapports, documents). Montants au format « 12 500 FCFA », dates JJ/MM/AAAA, horodatages stockés en UTC et affichés en `Africa/Douala`. [CLAUDE.md, ENF-07]
- **Glossaire** : `docs/glossaire-fr-en.md` relie chaque terme des exigences à son nom déjà posé dans le code (`internal_code`, `floor_price`, `active`, masquage vendeur). On l'étend, on n'invente pas de nouveaux noms de schéma. [Q5]
- **Nommage** : identifiants en ASCII, camelCase pour les valeurs et fonctions TypeScript, PascalCase pour les types et composants, snake_case seulement dans la base.
- **Fichiers** : noms de fichiers et de dossiers en kebab-case.
- **Où vit U4** : les règles métier catalogue vont dans `packages/domain` (tests d'abord) ; la persistance reste dans `packages/db/src/catalog/` ; l'interface va dans l'application de caisse existante `apps/pc-proof`. On ne crée pas `apps/caisse` ni `apps/proprietaire` dans cette intention. `packages/sync` n'est pas créé pour U4 : la table `outbox` existe déjà dans `db`. [Q5]
- **TypeScript strict**, aucun `any`. `tsconfig.base.json` active `strict` et des garde-fous supplémentaires (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). ESLint active les règles typées `no-explicit-any` / `no-unsafe-*`.
- **Validation Zod** à toutes les frontières : API, import (mapping de colonnes et vérification photo), lecture des paramètres, pont IPC d'Electron. Les fonctions pures du domaine refusent par `Result`, pas par Zod. [CLAUDE.md]
- **Formatage et lint** : Prettier (`.prettierrc.json`) pour le formatage, ESLint strict avec `typescript-eslint` typé pour le lint. Tous deux sont à la racine et lancés par `pnpm lint`. Les agents lisent cette configuration avant toute suggestion de style. La clôture ESLint de `packages/domain` doit aussi interdire `@tenu/db` avant la première fiche.
- **Frontières de couches** : `packages/domain` ne contient que des fonctions pures ; l'interdiction d'importer React, Electron, SQLite, le système de fichiers ou le réseau est vérifiée par ESLint. `apps/proprietaire` reste séparée de la caisse ; aujourd'hui la caisse vit dans `apps/pc-proof`. [Q5, CLAUDE.md]
- **Erreurs** : un refus métier attendu est un résultat typé (union discriminée) que l'appelant doit traiter. Une violation d'invariant ou une erreur de programmation lève une exception, jamais rattrapée pour être ignorée. Les messages affichés en français sont produits par l'interface à partir de codes stables.
- **Dépendances** : `pnpm-lock.yaml` committé, `packageManager` figé (`pnpm@10.15.0`), audit des dépendances avant chaque push (`high`). `vendor/` contient deux tarballs de test (`fast-check`, `pure-rand`) suivis par git ; ce n'est pas une chaîne fermée (le lockfile résout encore `pure-rand` depuis le registre). On ne vendorise pas un OCR tiers sans ADR et hash.
- **Electron durci** : isolation de contexte, pas d'intégration Node ni de contenu distant dans l'interface, pont IPC minimal et validé, CSP `connect-src 'none'`. U4 n'assouplit pas cette politique. Un appel réseau, s'il est un jour retenu, reste dans le processus principal, jamais dans le rendu. La photo est un fichier déjà sur le PC ; les permissions caméra restent refusées. [Q6]

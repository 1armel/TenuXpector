# Pratiques de l'équipe — TenuXpector

> Pratiques affirmées à l'entretien de découverte des pratiques (Q1 à Q6, résumé consolidé confirmé),
> intégrées par le lead à partir de son brouillon et des contributions qualité, développeur et
> sécurité. Développeur seul, projet greenfield. Détail des sources et des arbitrages : `evidence.md`.

## Way of Working

- Nous travaillons en trunk-based : `main` est la seule branche longue. Les worktrees de Construction partent de `main` et fusionnent sur `main`. [Q1]
- Nous ouvrons une branche courte par Bolt, c'est-à-dire par tranche de travail de quelques jours au plus. Une unité entière est découpée en plusieurs Bolts, ce que permet la règle « une unité ou fonctionnalité par branche » de `CLAUDE.md`. [Q1]
- Nous fusionnons chaque Bolt sur `main` par squash : un Bolt donne un commit sur `main`. Les commits intermédiaires de la branche sont libres. [Q1]
- Nous fusionnons en local, sans pull request, puis nous poussons `main` sur `origin`. Le contrôle avant fusion est assuré par les hooks git versionnés décrits sous `## Testing Posture`. [Q1, Q4]
- Le commit de squash sur `main` suit Conventional Commits et cite les identifiants d'exigence, par exemple `feat(caisse): blind close [EF-U3-31]`. [Q1, CLAUDE.md]
- Les plans, les tests et les commits citent les identifiants EF-, RG-, AL-, ENF-, DEC-. [CLAUDE.md]
- Chaque décision d'architecture donne lieu à un ADR dans `docs/adr/`. Les décisions DEC-01 à DEC-10 sont rédigées en ADR pendant U0. Tout module natif (base chiffrée, USB) a son ADR. [CLAUDE.md, exigences §4]
- Quand une question ouverte (Q-xx) bloque une tâche, nous la posons au lieu de supposer. Quand une demande contredit un invariant, nous le signalons au lieu de contourner. [CLAUDE.md]

## Walking Skeleton

- Nous construisons d'abord une tranche minimale de bout en bout. Ce premier Bolt est la preuve de concept P0 sur PC : sous Electron et Windows, une base locale chiffrée qui s'ouvre et survit à des coupures forcées, et un ticket qui sort sur l'imprimante USB (jalon J0). [Q2]
- Le code de P0 est conservé et sert de base au socle U0. Il respecte donc dès le départ les pratiques de code, de tests et de sécurité de ce document, en particulier le durcissement d'Electron. [Q2, Q4]
- P0 s'exécute seul, et nous l'approuvons explicitement avant les Bolts suivants. Ensuite, nous choisissons comment enchaîner les Bolts restants : en autonomie, ou avec une porte à chaque Bolt. [scope `skeleton: on`, org.md]
- L'ancienne règle du §11 (« une unité ne démarre qu'après l'usage réel de la précédente en boutique ») est retirée. Nous construisons tout, nous testons hors boutique avec les données de démonstration, puis nous installons en une fois. [périmètre I-03, Q4 du périmètre]

## Testing Posture

- **Methodology**: custom
- **Ordering**: Les règles métier de `packages/domain` et quatre invariants s'écrivent tests d'abord, avec un test vu rouge avant l'implémentation puis l'interface ; ces invariants sont les journaux à ajout seul, l'événement `outbox` écrit dans la même transaction que la donnée, le contrôle d'accès du tableau de bord dans l'API et la clôture à l'aveugle EF-U3-31 ; les autres adaptateurs et l'interface sont implémentés couche par couche puis testés avant la fusion du Bolt.
- **Couverture bloquante** : `pnpm test` mesure la couverture et échoue sous 90 % des lignes et des branches dans `packages/domain` (ENF-11), et sous 80 % dans chacun des autres paquets. Les seuils sont déclarés dans la configuration et ne sont jamais abaissés pour faire passer une étape. Les exclusions (types, fichiers générés, migrations, seed) sont listées explicitement. [Q3]
- **Outils** : Vitest pour les tests unitaires et d'intégration, fast-check pour les tests de propriétés (EF-U1-11, générateurs en entiers uniquement, DEC-04), Playwright pour les parcours de bout en bout sur Electron et les mesures ENF-01 et ENF-16. [Q3]
- **Volume** : stratégie de test `Comprehensive`. Chaque fichier de test couvre le cas nominal et au moins deux cas d'erreur ou limites. Aucun test ne passe quel que soit le code. [état du flux, phases/construction.md]
- **Parcours E2E obligatoire** : ouverture → vente → annulation → sortie d'espèces → clôture (ENF-11), sur Electron d'abord. La même suite sur Android viendra avec la tablette (I-02, ENF-15). [Q3, périmètre]
- **Tests lourds avant chaque jalon** (J0 à J3) et avant l'installation : arrêts forcés pendant une série de ventes (ENF-04, ENF-17 : 10 pour J0, 100 en recette), performance sur seed volumineux (ENF-01, 02, 03, 05), propriétés à volume élevé. [Q3]
- **Contrôles git versionnés**, installés automatiquement à l'installation des dépendances : [Q4]
  - **avant chaque commit** : recherche de secrets sur les fichiers indexés (ENF-08) et contrôle du mot interdit (ENF-14) ;
  - **avant chaque push** : `pnpm typecheck`, `pnpm lint`, `pnpm test` (avec la couverture bloquante) et audit des dépendances.
- **Porte de fin de tâche** : chaque tâche se termine par `pnpm typecheck && pnpm lint && pnpm test`. Un Bolt ne fusionne pas sur `main` si l'une de ces commandes échoue. [CLAUDE.md]
- **Contrôle ENF-14** : il vise les fichiers de code par une liste d'inclusion (`apps/`, `packages/`, fichiers de configuration à la racine). Le seul chemin exclu est le seed, désigné par son chemin exact. Le script ne contient pas le mot en clair et échoue si le périmètre inclus est vide. [Q4, contribution sécurité]
- **Intégration continue** : une CI GitHub minimale (installation à dépendances figées, puis typecheck, lint, tests) est ajoutée avant l'installation en boutique. Les exigences qui demandent une « CI bloquante » (ENF-08, 10, 11, 14, 15) sont reformulées en conséquence pendant l'analyse des exigences. [Q4]

## Deployment

- La phase Operation est ignorée dans ce flux : ni environnement de préproduction, ni déploiement automatique. [état du flux]
- Nous livrons en une fois. La V1 complète (J1 à J3) est construite et testée hors boutique sur les données de démonstration, puis installée en boutique en une seule fois. La saisie du registre réel suit dans les semaines suivantes. [périmètre]
- Chaque version installable est identifiée par une étiquette git sur `main`, posée sur un commit dont tous les contrôles sont verts. [Q5]
- Nous construisons l'installateur Windows d'Electron à la main. [Q5]
- Le serveur de synchronisation (U6) est déployé à la main, avec une procédure écrite de retour arrière. Ses secrets restent hors du dépôt. [Q5, phases/operation.md]
- Installation chez un client en moins d'une heure, import compris. Sur poste fixe, l'onduleur est une exigence d'installation documentée. [exigences ENF-13, ENF-17]

## Code Style

- **Langue du code** : tout le code est en anglais. Cela couvre les identifiants, les tables et colonnes de la base, les fonctions du domaine et les clés de paramètres (par exemple, le journal des mouvements de stock devient `stock_movements`). [Q5, Q6]
- **Langue du livrable** : tout ce que voient les utilisateurs est en français (interface, tickets, rapports, documents). Montants au format « 12 500 FCFA », dates JJ/MM/AAAA, horodatages stockés en UTC et affichés en `Africa/Douala`. [Q5, CLAUDE.md, ENF-07]
- **Glossaire** : un glossaire français-anglais dans la documentation relie chaque terme des exigences à son nom dans le code. `CLAUDE.md` et `docs/exigences-tenuxpector.md` seront alignés sur ce glossaire pendant l'analyse des exigences. [Q6]
- **Nommage** : identifiants en ASCII, camelCase pour les valeurs et fonctions TypeScript, PascalCase pour les types et composants, snake_case seulement dans la base. [Q5]
- **Fichiers** : noms de fichiers et de dossiers en kebab-case. [Q5]
- **TypeScript strict**, aucun `any`. [CLAUDE.md, ENF-11]
- **Validation Zod** à toutes les frontières : API, import, lecture des paramètres, pont IPC d'Electron. [CLAUDE.md, contribution sécurité]
- **Formatage et lint** : Prettier pour le formatage, ESLint strict avec les règles typées de typescript-eslint pour le lint. Tous deux sont configurés à la racine pendant P0/U0 et lancés par `pnpm lint`. Les agents lisent cette configuration avant toute suggestion de style. [Q5]
- **Frontières de couches** : `packages/domain` ne contient que des fonctions pures et ne peut importer ni base, ni interface, ni réseau. Cette interdiction est vérifiée par ESLint. `packages/sync` porte l'outbox et l'interface `SyncTransport`. `apps/proprietaire` est séparée de `apps/caisse`. [Q5, CLAUDE.md]
- **Erreurs** : un refus métier attendu est un résultat typé (union discriminée) que l'appelant doit traiter. Une violation d'invariant ou une erreur de programmation lève une exception, jamais rattrapée pour être ignorée. Les messages affichés en français sont produits par l'interface à partir de codes stables. [Q5]
- **Dépendances** : fichier de verrouillage committé, installation à dépendances figées, audit des dépendances avant chaque push. [Q4]
- **Electron durci dès P0** : isolation de contexte, pas d'intégration Node ni de contenu distant dans l'interface, pont IPC minimal et validé. [Q4]

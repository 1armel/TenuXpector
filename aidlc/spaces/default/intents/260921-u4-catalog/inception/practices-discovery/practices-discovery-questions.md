# Pratiques de travail — Questions

Relance : les pratiques de `team.md` (17 sept. 2026) restent la base. On ne repose pas branches, tests d’abord sur le domaine, livrable en français / code nouveau en anglais. Les questions portent **seulement** sur ce que le brouillon et les revues n’ont pas pu figer pour U4. Option A = recommandation.

## Q1. Comment travailler les branches pour U4 ?

Contexte : inchangé depuis la dernière affirmation — `main` unique, branche courte par tranche, squash local, commits conventionnels avec identifiants d’exigence.

A. On garde exactement ça
B. On change quelque chose — précise
C. Pas encore défini
D. Non applicable
E. Non identifié
X. Other (please specify)

[Answer]:A

## Q2. Construire d'abord une tranche minimale de bout en bout ? Un walking skeleton est une version minimale qui traverse tout le système, construite en premier pour prouver que les pièces s'assemblent avant d'ajouter les vraies fonctionnalités.

Contexte : P0 (base chiffrée, ticket USB) est **déjà livré**. Pour U4, le brouillon propose comme première tranche **C1** : fiche + recherche + rôles, dans l’application de caisse déjà sur le PC, vendable ensuite.

A. Oui : C1 dans l’app de caisse existante est la première tranche U4 ; on l’approuve avant C2–C4
B. Non : on livre fiche, clavier, import et photo dans un seul premier bloc
C. On recommence une preuve de concept séparée (nouvelle app) avant C1
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q3. Quelle discipline de tests pour U4 ?

Contexte : tests d’abord pour `packages/domain` et les quatre invariants ; 90 % domain / 80 % ailleurs. La revue qualité précise : ENF-16 (50 articles / 15 min) se **chronomètre** avec un opérateur, Playwright ne mesure que l’ajout au ticket (U3). ENF-02 (recherche rapide) concerne C1.

A. On garde la posture actuelle, **plus** : règles catalogue en TDD dans `domain` ; ENF-16 chronométré (pas Playwright) ; ENF-02 visé à J1 ; un parcours e2e « créer / retrouver / masquer les coûts » à J1, pas forcément bloquant à chaque fusion
B. Comme A, mais l’e2e C1 est **bloquant à chaque fusion**
C. On assouplit : plus de seuil 90 % domain pour U4
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q4. Les contrôles git (secrets, lint, tests, audit) : que faire des hooks qui ne s’exécutent pas sur ce PC Linux ?

Contexte : les scripts existent dans `.githooks` mais n’ont pas le bit exécutable observé. Sans ça, les portes avant commit/push peuvent ne jamais tourner.

A. On rend les hooks exécutables et on vérifie qu’ils partent bien avant le premier Bolt U4
B. On les laisse tels quels ; je lance `pnpm typecheck && pnpm lint && pnpm test` à la main
C. On ajoute une CI GitHub **maintenant** (en plus ou à la place)
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q5. Où vit le code catalogue, et sous quels noms ?

Contexte : l’app de caisse réelle est déjà sur le PC (`pc-proof`). Une partie des contrôles catalogue est encore dans la couche base. Le code **nouveau** reste en anglais ; les noms déjà persistés en base ne se renomment pas dans U4.

A. Règles métier catalogue dans `packages/domain` (tests d’abord) ; UI dans l’app de caisse existante, pas une nouvelle app ; noms de tables/colonnes déjà en base inchangés ; identifiants nouveaux en anglais
B. On crée une nouvelle app caisse pour U4
C. On laisse les règles catalogue dans la couche base
D. On renomme tout le schéma en anglais pendant U4
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Q6. Quelle règle dure pour la photo du registre ?

Contexte : déjà tranché métier (CR-01, CR-02) : pas d’envoi de prix d’achat ni d’image à un tiers avant spécimen. La revue sécurité demande de l’écrire en règle dure. Un appel HTTPS depuis l’interface casserait le durcissement Electron (`connect-src` fermé).

A. **NEVER** envoyer une image du registre ni un prix d’achat à un service tiers tant que le spécimen n’est pas vu ; si un appel réseau est un jour retenu, il reste hors de l’interface (processus principal), jamais dans le rendu
B. On ne fige pas de NEVER : ça reste une décision d’unité, pas une règle d’équipe
C. On autorise HTTPS depuis l’interface pour l’OCR
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Consolidated Summary Confirmation

Résumé de tes réponses, tel que je vais m'en servir pour figer les pratiques d'équipe :

- **Branches (Q1 = A)** : `main` unique, branche courte par tranche, squash local, commits conventionnels avec identifiants d'exigence — inchangé.
- **Première tranche U4 (Q2 = A)** : C1 (fiche + recherche + rôles) dans l'app de caisse existante, approuvée avant C2–C4. Un walking skeleton est une version minimale de bout en bout, construite d'abord pour prouver que les pièces s'assemblent.
- **Tests (Q3 = A)** : posture actuelle conservée ; règles catalogue en TDD dans `domain` ; ENF-16 chronométré (pas Playwright) ; ENF-02 visé à J1 ; e2e créer/retrouver/masquer à J1, pas bloquant à chaque fusion.
- **Hooks (Q4 = A)** : les rendre exécutables et vérifier qu'ils partent avant le premier Bolt U4.
- **Code (Q5 = A)** : règles catalogue dans `packages/domain` ; UI dans l'app existante ; schéma déjà en base inchangé ; identifiants nouveaux en anglais.
- **Photo (Q6 = A)** : NEVER envoyer une image du registre ni un prix d'achat à un tiers tant que le spécimen n'est pas vu ; un éventuel appel réseau reste hors de l'interface.

Does this all look correct before I generate the artifact?
- Looks correct
- Request changes

[Answer]:Looks correct

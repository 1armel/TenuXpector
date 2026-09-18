# Pratiques de travail — Questions

Ces questions fixent comment le projet est construit : branches, première tranche, tests, contrôles automatiques, style de code et livraison. Les propositions viennent de la proposition de l'ingénieur de livraison et des avis du responsable qualité, du développeur et de l'ingénieur sécurité (`contributions/`). Dans chaque question, l'option A est leur synthèse recommandée.

## Q1. Comment organiser les branches et les fusions ?

Contexte : tu travailles seul. `CLAUDE.md` impose déjà des commits conventionnels avec les identifiants d'exigence, et une unité ou fonctionnalité par branche.

A. Une seule ligne principale `main` ; une branche courte par tranche de travail (quelques jours au plus) ; fusion en un seul commit par tranche ; fusion en local, sans pull request ; commits conventionnels avec identifiants d'exigence
B. Une branche par unité entière (U0, U1…), fusionnée avec tout son historique
C. Tout directement sur `main`, sans branches
D. Comme A, mais avec une pull request GitHub avant chaque fusion
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Construire d'abord une tranche minimale de bout en bout ?

Contexte : un squelette qui marche (walking skeleton) est une version minimale qui traverse tout le système, construite en premier pour prouver que les pièces s'assemblent avant d'ajouter les vraies fonctionnalités. Le périmètre place déjà une preuve de concept sur PC en tête du carnet.

A. Oui : la preuve de concept sur PC (base chiffrée, impression USB, survie à une coupure) est cette première tranche, et son code est conservé comme base du socle
B. Oui, mais le code de la preuve de concept est jeté une fois la preuve faite
C. Oui, sous forme d'une tranche ouverture → vente → clôture posée sur le socle ; la preuve de concept reste à part
D. Non : on commence directement par le socle
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q3. Quelle discipline de tests ?

Contexte : `CLAUDE.md` impose les tests d'abord pour les règles métier de `packages/domain`. ENF-11 exige au moins 90 % de couverture de `domain`. Le responsable qualité propose d'étendre les tests d'abord aux invariants les plus risqués.

A. Tests d'abord pour le domaine et pour quatre invariants (journaux à ajout seul, événement de synchronisation dans la même transaction, contrôle d'accès dans l'API, clôture à l'aveugle) ; tests après ailleurs. Vitest, fast-check pour les propriétés, Playwright pour le bout en bout. `pnpm test` échoue sous 90 % de couverture dans `domain` et 80 % dans les autres paquets. Tests lourds (coupures, performance) avant chaque jalon
B. Tests d'abord partout, pour toutes les couches
C. Comme A, mais sans seuil de couverture hors de `domain`
D. Tests après partout ; seule la couverture de 90 % dans `domain` est imposée
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q4. Quels contrôles automatiques, sans étape d'intégration continue ?

Contexte : le plan allégé a retiré l'intégration continue, alors que plusieurs exigences (ENF-08, 10, 11, 14, 15) demandent une « CI bloquante ». Il faut décider ce qui garantit la qualité et la sécurité en attendant.

A. Contrôles git versionnés : avant chaque commit, recherche de secrets et contrôle du mot interdit (ENF-14) ; avant chaque push, typecheck, lint, tests et audit des dépendances. Fichier de verrouillage des dépendances figé, durcissement d'Electron dès la preuve de concept. Une intégration continue GitHub minimale ajoutée avant l'installation en boutique, et les exigences « CI bloquante » reformulées en ce sens
B. Contrôles git seulement, jamais d'intégration continue ; les exigences sont reformulées
C. Une intégration continue GitHub dès maintenant : on remet l'étape dans le plan
D. Aucune automatisation : je lance `pnpm typecheck && pnpm lint && pnpm test` à la main
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q5. Quel style de code et quelle livraison ?

Contexte : les exigences mélangent déjà vocabulaire métier en français et vocabulaire technique en anglais. Aucun outillage de formatage n'existe. Côté livraison, il n'y a ni environnement de préproduction ni déploiement automatique.

A. Métier en français, technique en anglais, jamais d'accent dans les identifiants ; camelCase dans le code, snake_case seulement en base ; fichiers en kebab-case ; Prettier et ESLint strict, avec interdiction d'importer base, interface ou réseau depuis `domain` ; refus métier en résultats typés, invariants violés en exceptions. Versions par étiquette git, installateur Windows construit à la main, serveur de synchronisation déployé à la main avec une procédure de retour arrière
B. Comme A, mais tous les identifiants en anglais
C. Comme A, mais Biome au lieu de Prettier et ESLint
D. Aucune convention imposée pour l'instant
E. Pas encore défini
X. Other (please specify)

[Answer]: X — Je code en anglais mais le livrable should in french cause my father and most of tht poeple in cameroon does not speak in english

## Q6. Jusqu'où va « le code en anglais » ?

Contexte : suite de ta réponse à Q5. Le livrable reste en français (interface, tickets, rapports, documents). Mais tes exigences et `CLAUDE.md` nomment déjà en français des éléments du code : les tables (`mouvements_stock`, `journal_audit`, `sessions_caisse`, `parametres`), les fonctions du domaine (`quantiteStock`, `evaluerAlertes`, `rapportJournalier`) et les clés de paramètres (`caisse.seuil_ecart`). Il faut savoir si ces noms sont traduits.

A. Tout le code en anglais, tables et fonctions comprises (`mouvements_stock` devient `stock_movements`) ; un glossaire français-anglais est ajouté à la documentation pour garder le lien avec les exigences
B. Le code en anglais, mais les noms déjà fixés par les exigences et `CLAUDE.md` (tables, fonctions du domaine, clés de paramètres) restent en français, pour rester traçables mot pour mot
C. Le code en anglais ; seules les tables et les clés de paramètres restent en français, les fonctions sont traduites
D. Tout en français finalement, sans accents, comme les exigences
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses, tel que l'ingénieur de livraison va l'intégrer dans les pratiques de l'équipe :

- **Branches** : une seule ligne principale `main` ; une branche courte par tranche de travail ; fusion en un seul commit par tranche, en local, sans pull request ; commits conventionnels avec identifiants d'exigence (Q1).
- **Première tranche** : la preuve de concept sur PC — base chiffrée, impression USB, survie à une coupure — est la première tranche de bout en bout, et son code est conservé comme base du socle (Q2).
- **Tests** : tests d'abord pour le domaine et pour quatre invariants (journaux à ajout seul, événement de synchronisation dans la même transaction, contrôle d'accès dans l'API, clôture à l'aveugle), tests après ailleurs ; Vitest, fast-check et Playwright ; `pnpm test` échoue sous 90 % de couverture dans `domain` et 80 % dans les autres paquets ; tests lourds avant chaque jalon (Q3).
- **Contrôles automatiques** : contrôles git versionnés — secrets et mot interdit avant chaque commit ; typecheck, lint, tests et audit des dépendances avant chaque push ; dépendances verrouillées ; Electron durci dès la preuve de concept ; une intégration continue GitHub minimale ajoutée avant l'installation en boutique, et les exigences « CI bloquante » reformulées en ce sens (Q4).
- **Langue** : tout le code est en anglais, tables, fonctions et clés de paramètres comprises, avec un glossaire français-anglais qui garde le lien avec les exigences ; tout ce que voient les utilisateurs — interface, tickets, rapports, documents — reste en français (Q5, Q6).
- **Style et livraison** : le reste de la proposition recommandée s'applique — camelCase, fichiers en kebab-case, Prettier et ESLint strict, `domain` sans import de base, d'interface ou de réseau, refus métier en résultats typés ; versions par étiquette git, installateur Windows et serveur de synchronisation déployés à la main avec une procédure de retour arrière (Q5).
- **À répercuter ensuite** : `CLAUDE.md` et `docs/exigences-tenuxpector.md` nomment encore les tables et fonctions en français ; ils seront alignés sur le glossaire à l'analyse des exigences.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

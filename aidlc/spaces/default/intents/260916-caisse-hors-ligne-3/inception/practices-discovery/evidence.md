# Preuves — découverte des pratiques

## Contexte

- Projet **greenfield** (`aidlc-state.md`) : aucun code applicatif, pas de `package.json`, pas de CI (`.github/` absent), pas de `docs/adr/`.
- Git : un seul commit, `c857f0f` sur `main`, suivi de `origin/main` (`https://github.com/1armel/TenuXpector.git`).
- `aidlc/spaces/default/memory/team.md` et `project.md` sont vides : aucune pratique déjà affirmée à reprendre.
- Scope `spec-driven-dual-target-ops` : `skeleton: on`, `change_control: strict`, profondeur et stratégie de test `Comprehensive`. `ci-pipeline` et la phase Operation sont en SKIP.

## Ce que chaque participant a inspecté

| Participant | Sources inspectées | Apport principal |
|---|---|---|
| Lead `aidlc-pipeline-deploy-agent` | `org.md` (5 sections), `CLAUDE.md`, `docs/exigences-tenuxpector.md` (§1.2, §1.4, §4, EF-U0-01/02/08, §8, §11), `docs/specifications.md`, `scope-document.md`, `intent-backlog.md`, `constraint-register.md`, `feasibility-assessment.md`, `aidlc-state.md`, `.gitignore`, historique git | Brouillon des cinq sections ; règles dures tirées de `CLAUDE.md` ; tensions T1 à T5 ; 20 questions d'entretien |
| `aidlc-quality-agent` | `CLAUDE.md`, exigences §5 U1, §6, §8, cadrage, `scope-document.md`, brouillon | Couverture rendue bloquante dans `pnpm test` ; tests d'abord étendus à quatre invariants ; fast-check ; carte des tests par couche ; deux niveaux de porte (fusion, jalon) ; options CI A/B/C |
| `aidlc-developer-agent` | `CLAUDE.md`, exigences §1.4, §4, EF-U0-01/02/05/07/08, U1, EF-U4-06, EF-U6-02, §8, cadrage §2.6, brouillon | Relevé du nommage réel ; fichiers en kebab-case ; graphe de dépendances et pureté de `domain` ; résultats typés contre exceptions ; ESLint typé strict ; une branche par Bolt |
| `aidlc-devsecops-agent` | Copie de travail et `HEAD` (`.mcp.json`, `.gitignore`, `.claude/settings.local.json`), exigences DEC-01, EF-U0-06, ENF-08, ENF-14, R-02/03/04, brouillon | Constat S1 (clés en clair) ; hooks pre-commit et pre-push ; chaîne d'approvisionnement pnpm ; modules natifs ; durcissement d'Electron ; liste d'inclusion ENF-14 ; règles DEC-01/ENF-08 manquantes |

## Décisions de l'entretien

Source : `practices-discovery-questions.md`, résumé consolidé confirmé par « Looks correct ».

| Question | Réponse | Décision |
|---|---|---|
| Q1 Branches | A | `main` seule ligne principale ; une branche courte par Bolt ; squash ; fusion locale sans pull request ; Conventional Commits avec identifiants |
| Q2 Squelette | A | P0 (base chiffrée, impression USB, survie à une coupure) est la première tranche de bout en bout ; son code est conservé comme base d'U0 |
| Q3 Tests | A | `custom` : tests d'abord pour `domain` et quatre invariants, tests après ailleurs ; Vitest, fast-check, Playwright ; `pnpm test` échoue sous 90 % dans `domain` (lignes et branches) et sous 80 % ailleurs ; tests lourds avant chaque jalon |
| Q4 Contrôles | A | Hooks git versionnés (pre-commit : secrets et mot interdit ; pre-push : typecheck, lint, tests, audit des dépendances) ; dépendances verrouillées ; Electron durci dès P0 ; CI GitHub minimale avant l'installation en boutique ; exigences « CI bloquante » à reformuler |
| Q5 Style et livraison | X | « Je code en anglais mais le livrable [doit être] en français » ; le reste de la proposition A s'applique : camelCase, kebab-case, Prettier + ESLint strict, `domain` sans import de base, d'interface ni de réseau, résultats typés et exceptions ; étiquettes git, installateur Windows et serveur de synchronisation déployés à la main avec retour arrière |
| Q6 Portée de l'anglais | A | Tout le code en anglais, tables, fonctions et clés de paramètres comprises ; glossaire français-anglais dans la documentation |

## Positions des contributions : intégrées ou tranchées par l'humain

| Position | Contribution | Sort |
|---|---|---|
| Méthodologie `custom` | qualité, développeur (AGREE) | Intégrée ; étendue à quatre invariants (Q3) |
| La couverture doit faire échouer `pnpm test` | qualité (OBJECT) | Intégrée (Q3) |
| Une porte manuelle n'est pas bloquante : hook ou CI | qualité, sécurité (OBJECT) | Intégrée : hooks maintenant, CI avant l'installation (Q4, option C de la qualité) |
| Plancher différencié, sans seuil pour les écrans | qualité (OBJECT) | **Tranché autrement** : 80 % dans tous les autres paquets (Q3) |
| Recherche de secrets au pre-commit, pas dans `pnpm lint` | sécurité (OBJECT) | Intégrée (Q4) |
| Liste d'inclusion pour ENF-14 plutôt que liste d'exclusion (T4) | sécurité (OBJECT), développeur et qualité (AGREE) | Intégrée dans `team-practices.md` et dans la règle `NEVER` |
| Nommage : métier en français, technique en anglais | développeur (Q-D1) | **Tranché autrement** : tout le code en anglais, livrable en français (Q5 X, Q6 A). Les questions Q-D2 (casse des champs) et Q-D3 (valeurs d'énumération) sont à revoir au regard du glossaire |
| Conventions d'erreurs et de fichiers manquantes | développeur (OBJECT) | Intégrées (Q5 A) |
| Frontières de couches incomplètes ; contrôle par lint | développeur, sécurité | Interdiction d'import dans `domain` vérifiée par ESLint : intégrée. Graphe complet (Q-D6) : non tranché |
| T2 n'est pas un conflit : une branche par Bolt | développeur (OBJECT) | Intégrée (Q1) |
| Règles DEC-01/ENF-08 manquantes (chiffrement, PIN, TLS et jetons, filtrage par rôle) | sécurité (OBJECT) | Intégrées dans `## Mandated` ; exigences obligatoires non rejetées par l'humain |
| Description incomplète du `.gitignore` | sécurité (OBJECT) | Corrigée ci-dessous |
| Durcissement d'Electron dès P0 si le code est conservé | sécurité (AGREE) | Intégrée (Q2, Q4) |
| Déploiement manuel du VPS avec retour arrière | sécurité (AGREE) | Intégrée (Q5) |

## Arbitrages du lead à l'intégration

- **Invariants énoncés par leur sens.** `CLAUDE.md` nomme les journaux à ajout seul par leurs tables françaises. Comme Q6 traduit les tables, les règles de `discovered-rules.md` décrivent le sens (« mouvements de stock », « journal d'audit », « session de caisse ouverte », « table des paramètres ») au lieu des noms. Ainsi, les règles promues restent vraies après le renommage. `tenant_id` et `outbox` sont déjà en anglais et restent littéraux.
- **Mot interdit.** La règle `NEVER` renvoie à ENF-14 sans écrire le mot, et précise le périmètre d'inclusion (`apps/`, `packages/`, configuration à la racine, seed exclu). Elle ne crée donc pas de faux positif une fois promue dans `aidlc/spaces/default/memory/project.md`.
- **Seuil de 80 %.** Il est inscrit comme pratique dans `team-practices.md` et non comme règle dure : c'est un choix d'entretien, révisable, alors que le seuil de 90 % de `domain` vient d'ENF-11.
- **`.gitignore`, correction.** Il contient le gabarit Node/Vite **et** le bloc AI-DLC, qui ignore notamment `.claude/settings.local.json`. Il ne couvre pas encore `.env*`, les fichiers SQLite, les sorties d'empaquetage ni le matériel de signature : c'est à compléter pendant P0/U0.

## Sécurité : constat S1

- **Constat** (devsecops) : `.mcp.json`, suivi par git, contenait dans la copie de travail deux clés d'API en clair (Confluence et Context7). Elles n'étaient ni committées ni poussées.
- **Traitement** : avec l'accord du propriétaire, les deux valeurs ont été remplacées par les renvois `${CONFLUENCE_API_KEY}` et `${CONTEXT7_API_KEY}`, puis la correction a été vérifiée. Aucune valeur n'est reproduite ici.
- **Statut** : **résolu, action du propriétaire en attente**. La révocation et la régénération des deux clés reviennent au propriétaire.

## Suites à donner, hors de cette étape

- Pendant l'analyse des exigences, aligner `CLAUDE.md` et `docs/exigences-tenuxpector.md` sur le glossaire français-anglais (noms de tables, de fonctions et de clés de paramètres).
- Pendant l'analyse des exigences, reformuler ENF-08, 10, 11, 14 et 15 : hooks bloquants jusqu'à l'installation, CI minimale avant l'installation.
- Reformuler ENF-15 (parité Android) comme exigence différée avec la tablette (I-02).

## Incertitudes restantes

- **Outils non nommés** : outil de recherche de secrets (Gitleaks proposé), gestionnaire de hooks (lefthook, simple-git-hooks ou husky), fournisseur de couverture (v8 ou istanbul), seuil de l'audit des dépendances (`high` proposé). À fixer par ADR pendant P0/U0.
- **Couverture à 80 %** : la mesure retenue est la couverture des lignes, qui est la forme du plancher d'`org.md`. L'entretien n'a pas précisé si les branches comptent aussi hors de `domain`.
- **Glossaire** : emplacement exact dans `docs/`. Il reste aussi à décider si les valeurs d'énumération stockées en base (types de mouvement, rôles, moyens de paiement) sont traduites, et si les champs du domaine suivent la casse camelCase avec une correspondance dans `packages/db` (Q-D2, Q-D3).
- **Langue des messages de commit** : non tranchée (code en anglais, exemple de `CLAUDE.md` en français).
- **Non tranché** : signature Authenticode de l'installateur (S7), Semgrep (S6), test de mutation Stryker, politique de versions et de quarantaine des dépendances (S5), paquet d'empaquetage `apps/caisse-electron` contre sous-dossier (Q-D5), graphe de dépendances complet (Q-D6).
- **Service tiers d'extraction de texte (R-02, S8)** : risque d'envoyer des prix d'achat à un tiers. À trancher avant U2.
- **Machine de référence** pour ENF-01/02/03 tant que la tablette n'existe pas, et nombre d'essais de coupure physique réelle avant installation.
- **Plateforme de l'application du propriétaire** (U6) : non décidée, elle peut ajouter une cible de build et de test.

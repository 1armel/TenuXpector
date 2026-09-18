**Collaborator:** aidlc-devsecops-agent

## Contribution

> Revue de soutien, en aveugle, centrée sur le lint, le SAST/DAST, la recherche de secrets, l'audit des dépendances et la chaîne d'approvisionnement. Niveau pratique uniquement : les choix de conception (gestion de la clé SQLCipher, jetons, durcissement du VPS) restent pour `nfr-design` / `infrastructure-design`. Inspecté au commit `c857f0f` et dans la copie de travail au 2026-09-17.

### 0. Constat bloquant à traiter avant tout commit : secrets en clair dans `.mcp.json`

- `.mcp.json` est **suivi par git** et **modifié** dans la copie de travail (`git status` : ` M .mcp.json`).
- Version committée (`HEAD`) : `CONTEXT7_API_KEY` vaut un renvoi `${CONTEXT7_API_KEY}`, ce qui est correct.
- Copie de travail : **deux clés d'API en clair**, `CONFLUENCE_API_KEY` et `CONTEXT7_API_KEY` (valeurs vérifiées, volontairement non reproduites ici).
- Elles ne sont **pas encore** dans l'historique ni sur `origin/main`. Un simple `git add -A` / `git commit -a` les publierait sur GitHub, ce qui violerait ENF-08 (« aucun secret dans le dépôt ») avant même la première ligne de code.
- Recommandation immédiate :
  1. remettre les renvois `${CONFLUENCE_API_KEY}` et `${CONTEXT7_API_KEY}` dans `.mcp.json`, avec les valeurs passées par l'environnement ;
  2. **révoquer puis régénérer les deux clés** par précaution : elles sont écrites en clair sur disque et ont été lues dans des sessions d'agent ;
  3. installer la recherche de secrets au moment du commit (§2) **avant** le prochain commit.
- Ce constat montre qu'un contrôle manuel ou lancé « en fin de tâche » ne suffit pas. Le contrôle doit se déclencher au moment du commit.

### 1. `.gitignore` et fichiers locaux sensibles

- Vérifié (`git check-ignore -v`) : `.claude/settings.local.json` est bien ignoré, par la ligne explicite du bloc AI-DLC. Le motif `*.local` du gabarit Vite **ne le couvre pas** (le fichier se termine par `.json`), donc la ligne explicite doit rester.
- Ce fichier contient `AIDLC_SKIP_HUMAN_PRESENCE_GUARD` et `AIDLC_SKIP_SUMMARY_CONFIRMATION_GUARD`, qui contournent des gardes du flux. Pratiques proposées :
  - NEVER committer `.claude/settings.local.json`, ni recopier ces variables dans `.claude/settings.json` (partagé) ;
  - la recherche de secrets et le hook de commit refusent aussi tout fichier `settings.local.json` indexé (règle de chemin, pas seulement d'entropie).
- Manques à combler pendant U0 (le `.gitignore` actuel ne les couvre pas) :
  - `.env` et `.env.*`, sauf `!.env.example` (secrets du VPS U6, clé de chiffrement de démonstration) ;
  - bases locales et exports : `*.db`, `*.sqlite`, `*.sqlite3`, `*-wal`, `*-shm`, sauvegardes chiffrées ENF-10 produites en test ;
  - sorties d'empaquetage Electron (`release/`, `out/`) et matériel de signature (`*.pfx`, `*.p12`, `*.pem`, `*.key`) ;
  - rapports de sécurité générés (SBOM, résultats d'audit), sauf s'ils sont volontairement archivés avec une version.
- Correction factuelle pour `evidence.md` : le `.gitignore` ne se limite pas au gabarit Node/Vite ; il contient aussi le bloc AI-DLC (curseurs, état machine, `.claude/settings.local.json`).

### 2. Porte locale sans CI : ce qui tourne, où et quand

La porte `pnpm typecheck && pnpm lint && pnpm test` se lance **après** l'écriture du code, et souvent après `git add`. Elle n'empêche donc pas un secret d'entrer dans l'historique. Organisation proposée, entièrement versionnée dans le dépôt :

| Moment | Contrôle | Blocage |
|---|---|---|
| `pre-commit` (fichiers indexés seulement, < 5 s) | Recherche de secrets sur l'index (Gitleaks `protect --staged` ou équivalent) ; mot interdit ENF-14 (§6) ; format et lint des fichiers modifiés | Bloque le commit |
| `pre-push` | `pnpm verify` = `typecheck` + `lint` + `test` + `check:secrets` (dépôt entier) + `check:mot-interdit` (dépôt entier) + `pnpm audit --prod --audit-level high` | Bloque le push |
| Avant fusion d'un Bolt sur `main` | `pnpm verify` + `pnpm install --frozen-lockfile` sur une copie propre (worktree neuf) | Pas de fusion si rouge |
| Avant chaque étiquette de version (jalon) | `pnpm verify` + tests lourds + SBOM + audit complet (dépendances de dev comprises) | Pas d'étiquette si rouge |

- Gestionnaire de hooks : un outil versionné et installé par le script `prepare` (lefthook ou simple-git-hooks), pour qu'un clone neuf soit protégé sans étape manuelle. Husky convient aussi. **Décision humaine.**
- Pratique : NEVER utiliser `git commit --no-verify` ni `git push --no-verify`. Un faux positif se traite par une exception écrite dans la configuration de l'outil (voir la liste d'exceptions ci-dessous), jamais en sautant le hook.
- Filets côté GitHub, sans CI : activer les **alertes Dependabot** et, si le plan du dépôt le permet, le **secret scanning avec push protection**. Ils ne remplacent pas les hooks, qui restent contournables en local, mais ils fonctionnent sans étape `ci-pipeline`.
- Exceptions (faux positifs, CVE acceptées) : un seul fichier versionné par outil (par ex. `.gitleaksignore`, `security/audit-exceptions.json`), chaque entrée portant une **justification**, l'identifiant d'exigence concerné et une **date d'expiration**. Une exception expirée fait échouer la porte.
- Sur T1 : les hooks et les filets GitHub sont un palliatif acceptable jusqu'à J3, mais ENF-08 et ENF-14 disent « en CI ». Un workflow GitHub Actions d'un seul job (`pnpm install --frozen-lockfile` puis `pnpm verify`) coûte peu. Il donne un contrôle que le développeur ne peut pas sauter par erreur. Je recommande de l'avoir **avant l'installation en boutique**, ou alors de modifier explicitement ENF-08 et ENF-14. **Décision humaine.**

### 3. Dépendances pnpm et chaîne d'approvisionnement

Pratiques proposées dès U0 :

- `pnpm-lock.yaml` **committé** ; toute installation dans la porte et sur une copie propre se fait avec `--frozen-lockfile`. Un changement du lockfile a son propre commit (`build(deps): ...`) et n'est jamais caché dans un commit fonctionnel.
- Version de pnpm figée par le champ `packageManager` de `package.json` (Corepack) ; version de Node figée (`engines` + `engine-strict=true`, fichier `.nvmrc` ou `.node-version`).
- Versions **exactes** (`save-exact=true` dans `.npmrc`), au moins pour les dépendances d'exécution critiques : `electron`, liaison SQLCipher, bibliothèque USB/ESC/POS, ORM, `zod`, bibliothèques de crypto.
- Scripts d'installation : pnpm 10 ne lance plus les scripts `postinstall` des dépendances par défaut. On garde ce défaut et on tient une **liste blanche explicite** (`onlyBuiltDependencies` dans `pnpm-workspace.yaml`), limitée aux modules natifs réellement nécessaires. Tout ajout à cette liste passe par une revue.
- Délai de quarantaine des nouvelles versions : réglage `minimumReleaseAge` de pnpm, par ex. 3 jours. Il protège des paquets compromis publiés puis retirés dans les heures suivantes, comme les attaques par vers npm de 2025. Valeur à trancher.
- Registre unique `registry.npmjs.org` ; pas de dépendance `git+` ni tarball distant sans ADR.
- Audit : `pnpm audit --prod --audit-level high` bloquant au `pre-push` ; audit complet avant chaque étiquette. Pour les versions sans correctif, une exception datée (§2).
- Mises à jour : Renovate ou Dependabot en mode « version updates », groupées, **mensuelles**, avec le même délai de quarantaine. Electron suit un rythme dédié (§5).
- SBOM CycloneDX produite à chaque étiquette de version et conservée avec l'installateur (outil à choisir pendant U0).
- Toute **nouvelle dépendance d'exécution** est justifiée dans le commit ou la PR (fonction, mainteneur actif, licence compatible, nombre de dépendances transitives). Une dépendance **native** ou **réseau** exige un ADR (§4).
- `packages/domain` n'a **aucune** dépendance d'exécution hors utilitaires purs (règle de lint `no-restricted-imports`, voir §7). C'est à la fois une règle d'architecture et la plus petite surface d'attaque possible pour le cœur métier.

### 4. Modules natifs (SQLCipher, USB) sous Electron et Windows

C'est le risque de chaîne d'approvisionnement le plus concret du projet (voir aussi R-03 et R-04) :

- **Binaires précompilés** : les liaisons SQLite chiffrées et les bibliothèques USB téléchargent souvent un binaire au moment de l'installation (prebuild depuis des releases GitHub). Le hash d'intégrité du lockfile couvre l'archive npm, **pas** ce binaire téléchargé ensuite. Pratique : recompiler depuis les sources contre l'ABI de la version d'Electron figée (`@electron/rebuild`), ou vérifier la somme de contrôle du binaire. Le choix est consigné dans l'ADR du module.
- **Critères d'ADR pour tout module natif** : maintenance active (dernière version < 12 mois), compatibilité avec la version d'Electron retenue, provenance du binaire, licence, version de SQLCipher embarquée et suivi de ses CVE, équivalent Capacitor pour la parité ENF-15.
- **Impression USB** : les paquets ESC/POS « tout-en-un » pour Node sont souvent abandonnés. DEC-11 impose déjà un adaptateur. Il vaut mieux écrire un encodeur ESC/POS minimal et testé dans le dépôt, et garder la dépendance native au strict transport USB (ou passer par le spouleur Windows en mode brut). Sous Windows, un accès libusb direct peut exiger de remplacer le pilote du fabricant (WinUSB), ce qui rejoint R-04 : à trancher par la preuve de concept P0, pas par supposition.
- **Chaîne de compilation Windows** : version de Visual Studio Build Tools et de Python documentée dans le README d'U0, pour que la compilation native soit reproductible.
- **Clé de la base chiffrée** : NEVER dans le code, le dépôt, les logs ni `parametres`. La manière de la protéger (par ex. `safeStorage` / DPAPI sous Windows, Keystore sous Android) est une décision de conception à prendre pendant `nfr-design`, sous forme d'ADR relié à DEC-01.

### 5. Durcissement Electron à appliquer dès le premier Bolt (P0 compris)

Ces pratiques ne coûtent rien au départ et coûtent cher à rattraper. Elles doivent être dans la **preuve de concept P0**, puisque son code peut devenir la base d'U0 :

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` et `webSecurity: true` sur **toute** `BrowserWindow`. Pas de `@electron/remote`.
- Le renderer n'accède au système qu'à travers un `preload` qui expose, via `contextBridge`, une API **minimale et typée** (pas de `ipcRenderer` brut exposé).
- Chaque gestionnaire `ipcMain.handle` valide sa charge avec **Zod** (règle « Zod à toutes les frontières » : l'IPC est une frontière) et vérifie l'origine de l'appelant (`event.senderFrame`).
- Contenu uniquement local et empaqueté : aucun chargement de page distante dans le renderer, `will-navigate` bloqué, `setWindowOpenHandler` qui refuse par défaut, `shell.openExternal` limité à une liste blanche.
- Content-Security-Policy stricte : pas de `unsafe-eval`, pas de script distant.
- **Electron Fuses** activés à l'empaquetage : `RunAsNode` désactivé, `EnableNodeOptionsEnvironmentVariable` et `EnableNodeCliInspectArguments` désactivés, `EnableEmbeddedAsarIntegrityValidation` et `OnlyLoadAppFromAsar` activés.
- Outils de développement désactivés dans les versions installables.
- Version d'Electron : toujours une version majeure **encore supportée** (Electron ne supporte que les trois dernières). Montée de version au moins à chaque jalon, avec reconstruction des modules natifs et relance du parcours E2E.
- **Testable** : un test unitaire vérifie les `webPreferences` de chaque fenêtre créée et la configuration des fuses. On évite ainsi qu'une régression passe inaperçue, puisqu'il n'existe pas d'outil de scan Electron fiable et maintenu à confier à une CI.
- Mises à jour automatiques : aucune tant que la livraison est manuelle. Si elles arrivent un jour, elles sont signées et vérifiées (ADR).
- Signature Authenticode de l'installateur Windows : sans elle, SmartScreen avertit et l'intégrité de l'installateur n'est pas vérifiable en boutique. Le coût d'un certificat est une **décision humaine** (question 16 du lead).
- Plus tard, côté Capacitor : `android:allowBackup="false"` (sinon la base peut être extraite par sauvegarde), pas de trafic en clair, WebView sans débogage en production. Ces points sont à reprendre quand la cible tablette s'ouvre (I-02).

### 6. Contrôle ENF-14 (mot interdit) : forme et exclusions

- **Liste d'inclusion plutôt que liste d'exclusion.** ENF-14 dit « fichier de code ». On vérifie donc explicitement `apps/**`, `packages/**` et les fichiers de configuration à la racine (`*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.cjs`, `*.json`, `*.css`, `*.html`, `*.yaml`, `*.sql`), et **non** « tout sauf `docs/`, `aidlc/`, `CLAUDE.md` ». Une liste d'exclusion oublierait `.claude/`, `README.md`, les futurs dossiers, et échouerait sur la règle elle-même une fois promue dans `aidlc/spaces/default/memory/project.md` (T4).
- **Seed** : seule exclusion interne, par **chemin exact** (par ex. `packages/db/seed/**`), écrite dans le script et citée par ENF-14. Pas d'exclusion par motif large.
- **Variantes** : recherche insensible à la casse, qui couvre aussi le pluriel et le nom de métier dérivé (même racine). Une recherche sur la racine du mot suffit.
- **Le script ne contient pas le mot en clair** : le motif est assemblé à partir de fragments ou lu depuis un fichier hors du périmètre de code. Sinon le contrôle échoue sur lui-même. Le test du contrôle crée ses fichiers de test dans un dossier temporaire, avec le motif assemblé à l'exécution.
- **Placement** : un script `check:mot-interdit` du dépôt (Node, sans dépendance), appelé au `pre-commit` sur les fichiers indexés et dans `pnpm verify` sur tout le périmètre. Chemins et variantes sont testés par Vitest, pour que le contrôle ne « passe » pas faute de fichiers trouvés (le script échoue si le périmètre inclus est vide).
- Hors périmètre, à confirmer : messages de commit, noms de branche, artefacts empaquetés (`app.asar`). Je propose de ne pas les contrôler, puisque le contrôle des sources couvre ce qui est empaqueté.

### 7. Lint et SAST

- ESLint + typescript-eslint en configuration `strict-type-checked`, avec en **erreur** : `no-explicit-any`, `no-eval`, `no-implied-eval`, `no-new-func`, `@typescript-eslint/no-floating-promises` (une promesse de transaction ignorée casse l'invariant outbox), et `no-restricted-imports` / frontières de paquets (`packages/domain` n'importe ni base, ni UI, ni réseau ; `apps/caisse` n'importe pas le client HTTP de l'API pour ses lectures).
- Règles maison `no-restricted-syntax` (ou Semgrep) pour les invariants de sécurité et de données qu'on peut détecter statiquement :
  - appel de journalisation qui reçoit un champ nommé `pin`, `prixAchat` / `prix_achat`, `cump`, `jeton` / `token` (ENF-08, logs) ;
  - `.update()` / `.delete()` sur les tables append-only, ou SQL brut `UPDATE` / `DELETE` qui les vise ;
  - `Math.random` pour un identifiant, un sel ou un jeton (utiliser `crypto`).
- Complément dynamique indispensable, puisque la règle statique ne voit pas tout : le logger applique une liste de **champs masqués**, et un test vérifie qu'un PIN, un prix d'achat et un jeton n'apparaissent jamais dans la sortie de log.
- **SAST dédié** : Semgrep CE (règles locales, exécution hors ligne) est utile mais optionnel pour un développeur seul. ESLint avec les règles ci-dessus couvre l'essentiel. **Décision humaine.**
- **DAST** : sans objet tant qu'il n'y a pas d'API. À U6, un scan OWASP ZAP « baseline » contre l'API lancée en local, avant chaque déploiement manuel sur le VPS. Le test paramétré d'isolation des tenants (toutes les routes) et le test du contrôle d'accès du tableau de bord restent les vrais contrôles et sont bloquants.
- Hachage du PIN : les paramètres d'EF-U0-06 (PBKDF2-SHA256, ≥ 310 000 itérations, sel par utilisateur) sont vérifiés par un test du domaine ou de l'adaptateur, avec une comparaison en temps constant (`timingSafeEqual`).

### 8. Données envoyées à un service tiers (R-02)

- Le tableau des unités de `docs/exigences-tenuxpector.md` (U2) cite un service web public d'extraction de texte depuis une photo. R-02 note que les photos du registre transmettraient les prix d'achat à ce tiers.
- Cela touche CR-05 (prix d'achat cachés), ENF-08 et l'invariant « aucune fonctionnalité métier ne dépend du réseau ».
- Pratique proposée : NEVER envoyer une donnée métier (prix d'achat, CUMP, données clients CR-02) à un service tiers sans ADR qui nomme le service, les données transmises, le lieu d'hébergement (CR-03, CR-04) et la solution de repli hors ligne.

### 9. Règles dures manquantes dans `discovered-rules.md`

Ces règles sont énoncées comme obligatoires dans le document qui fait foi. Je propose de les ajouter, sans rien inférer :

- ALWAYS chiffrer la base locale au repos sur chaque cible (SQLCipher). [DEC-01] [ENF-08]
- ALWAYS stocker le PIN haché en PBKDF2-SHA256, avec au moins 310 000 itérations et un sel par utilisateur, et le vérifier sans réseau. [EF-U0-06]
- ALWAYS utiliser TLS 1.2 ou plus récent pour tout échange réseau, et des jetons révocables. [ENF-08]
- ALWAYS faire le filtrage par rôle dans la couche de lecture de l'UI de caisse **et** côté API pour tout appareil autre que la caisse, avec des tests. [DEC-01]

À placer dans `team-practices.md` (révisables, sous réserve de l'entretien) : hooks de commit et de push, interdiction de `--no-verify`, `.mcp.json` en renvois `${VAR}` uniquement, `.claude/settings.local.json` jamais committé, lockfile figé, liste blanche des scripts d'installation, durcissement Electron vérifié par test, liste d'inclusion du contrôle ENF-14.

### 10. Décisions de sécurité que la personne doit trancher

Ces décisions complètent les questions 11, 12 et 16 du lead :

- **S1 (immédiat)** : confirmer la révocation et la régénération des clés Confluence et Context7, et le retour aux renvois `${VAR}` dans `.mcp.json` avant tout commit.
- **S2** : outil de recherche de secrets (Gitleaks recommandé) et gestionnaire de hooks (lefthook, simple-git-hooks ou husky).
- **S3 (T1)** : hooks locaux + alertes Dependabot et secret scanning GitHub jusqu'à J3, puis un workflow GitHub Actions minimal **avant l'installation** ? Ou bien modification explicite d'ENF-08 et d'ENF-14 ?
- **S4** : seuil bloquant de `pnpm audit` (proposé : `high`, dépendances de production, au `pre-push`) et format des exceptions datées.
- **S5** : politique de versions : versions exactes (toutes ou dépendances critiques seulement), valeur de `minimumReleaseAge`, fréquence des mises à jour groupées.
- **S6** : Semgrep en plus d'ESLint, oui ou non.
- **S7** : signature Authenticode de l'installateur Windows (coût d'un certificat) ou installateur non signé, avec somme de contrôle SHA-256 publiée.
- **S8 (R-02)** : extraction de texte depuis une photo par un service tiers interdite, remplacée par un OCR local, ou acceptée avec recadrage. Cela conditionne U2.
- **S9** : rythme de montée de version d'Electron (proposé : au moins à chaque jalon, jamais sur une version majeure plus supportée).
- **S10** : périmètre du contrôle ENF-14 : liste d'inclusion proposée, chemin exact du seed, et contrôle ou non des messages de commit et des artefacts empaquetés.

## Positions

- AGREE: NEVER committer de secret dans le dépôt (Forbidden, ENF-08) — c'est une exigence qui fait foi, et le constat du §0 (deux clés en clair dans `.mcp.json`, à un commit d'être publiées) montre qu'elle est déjà exposée.
- OBJECT: « Contrôles automatiques à rattacher à la porte locale — leur place (script `pnpm lint`, hook git) est à confirmer » — la recherche de secrets ne peut pas vivre seulement dans `pnpm lint` ou dans la porte de fin de tâche, qui passe après `git add` : elle doit bloquer au `pre-commit`, avec le dépôt entier revérifié au `pre-push`, sinon le secret est déjà dans l'historique quand on le détecte.
- OBJECT: T4 (« le contrôle automatique doit exclure `docs/`, `aidlc/`, `CLAUDE.md` et le seed ») — une liste d'exclusion est fragile (elle oublie `.claude/`, `README.md` et les futurs dossiers). ENF-14 vise les « fichiers de code », donc une liste d'inclusion (`apps/**`, `packages/**`, configurations racine), avec le seed exclu par chemin exact et un script qui ne contient pas le mot en clair.
- AGREE: T1 (CI bloquante exigée contre `ci-pipeline` en SKIP) — tension réelle. Les hooks et les filets GitHub (alertes Dependabot, secret scanning) couvrent l'essentiel sans CI, mais les hooks restent contournables : je recommande un workflow minimal avant l'installation, ou une modification explicite des ENF concernées.
- OBJECT: `discovered-rules.md` ne retient d'ENF-08 que les secrets et les logs — le chiffrement de la base locale (DEC-01, ENF-08), le hachage du PIN (EF-U0-06), TLS 1.2+ et les jetons révocables (ENF-08), et le double filtrage par rôle (DEC-01) sont énoncés comme obligatoires dans le document qui fait foi. Ils relèvent des règles dures, pas des pratiques (§9).
- OBJECT: `evidence.md` décrit le `.gitignore` comme un « gabarit Node/Vite : pas d'autre convention » — il contient aussi le bloc AI-DLC, qui ignore `.claude/settings.local.json` (variables de contournement des gardes), et il lui manque `.env*`, les fichiers de base SQLite, les sorties d'empaquetage et le matériel de signature (§1).
- AGREE: question 20 (règles de lint bloquantes, dont l'interdiction d'importer une base, un framework UI ou le réseau depuis `packages/domain`) — c'est aussi un contrôle de sécurité : le cœur métier garde une surface de dépendances minimale et ne peut pas émettre de trafic réseau.
- AGREE: questions 5 et 6 (P0 comme squelette, et sort du code de P0) — si le code de P0 est conservé, le durcissement Electron du §5 et le choix documenté du module SQLCipher (R-03) doivent y figurer dès le départ, sinon ils seront rattrapés dans une base déjà construite.
- AGREE: question 16 (installateur construit localement, signé ou non) — c'est une vraie décision de sécurité (intégrité de l'installateur, avertissement SmartScreen), reprise en S7 avec l'option d'une somme de contrôle publiée si on ne signe pas.
- AGREE: question 17 (VPS U6 déployé à la main avec une procédure de retour arrière) — acceptable tant que les étapes Operation sont en SKIP, à condition que les secrets du VPS restent hors du dépôt (`.env.example` seul versionné) et qu'un scan ZAP « baseline » en local précède chaque déploiement (§7).

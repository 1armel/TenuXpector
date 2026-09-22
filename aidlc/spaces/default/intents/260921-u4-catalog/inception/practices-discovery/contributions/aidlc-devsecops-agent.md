**Collaborator:** aidlc-devsecops-agent

## Contribution

Revue indépendante des contrôles de sécurité pour la relance brownfield U4. Sources lues : brouillons lead (`team-practices.md`, `discovered-rules.md`, `evidence.md`), `team.md` / `project.md` (affirmés 2026-09-17), `.githooks/`, `scripts/check-staged-secrets.mjs`, `scripts/check-forbidden-word.mjs`, `scripts/install-git-hooks.mjs`, `package.json`, `pnpm-lock.yaml`, `vendor/*.tgz`, `eslint.config.js`, `.prettierrc.json`, `apps/pc-proof/src/main/security.ts`, pont IPC, `packages/db/src/encryption-key.ts`, invariants `CLAUDE.md`, décisions U4 (CR-01, CR-02, D-INT-07). Aucune contribution sœur lue.

### Lint et formatage

Le lead décrit correctement la baseline observée : Prettier à la racine (`.prettierrc.json`), ESLint `strictTypeChecked` avec `no-explicit-any` / `no-unsafe-*`, frontière `packages/domain` et interdiction Node dans le renderer, lancés par `pnpm lint` avant push. Les agents doivent toujours lire cette config avant toute suggestion de style.

Écarts à consigner, pas à inventer comme nouvelles règles dures :

- `pnpm format:check` existe mais **n’est pas** dans le `pre-push`. Seul `pnpm lint` (plus `eslint-config-prettier`) ferme le style. Un fichier mal formaté peut donc fusionner.
- `eslint.config.js` ignore `scripts/**`. Les contrôles ENF-08 / ENF-14 eux-mêmes ne sont pas lintés ni typés.
- Pas d’extension SAST dédiée (`eslint-plugin-security`, Semgrep). Le lint typé est le seul analyseur statique.

Proposition d’entretien : garder lint comme porte de fusion ; `format:check` reste local sauf si l’humain veut l’ajouter au `pre-push`. Semgrep / Sonar restent hors U4, comme le lead le propose déjà (incertitude 11).

### SAST / DAST

- **SAST** : TypeScript strict + ESLint typé + tests de politique Electron (`apps/pc-proof/tests/main.spec.ts`). Aucun Semgrep, CodeGuru, Sonar. Acceptable pour U4 tant que `ci-pipeline` rejoue au moins `typecheck`, `lint` et `test` — pas un outil nouveau.
- **DAST** : aucun scan dynamique (pas de ZAP, pas d’environnement de staging). Cohérent avec le déploiement manuel hors boutique et l’absence de serveur dans U4. Les tests Playwright Electron tiennent lieu de sonde runtime, pas de DAST.
- Ne pas assouplir la CSP ni le sandbox « pour faciliter un DAST » : il n’y en a pas, et U4 n’en a pas besoin.

### Secrets (ENF-08)

Le `pre-commit` lance `scripts/check-staged-secrets.mjs` : motifs de premier rideau (en-tête de clé privée, `AKIA…`, jetons GitHub/Slack, affectation `secret|password|api_key|…` à une littérale ≥ 32 caractères). Le script le dit lui-même : ce n’est pas Gitleaks / truffleHog, et il ne remplace pas une revue.

Limites observées :

- Périmètre **indexé seulement** (sauf `--all`, jamais appelé par le hook). Un secret déjà committé n’est plus vu.
- Pas de scan d’entropie, pas de motifs PIN / prix d’achat / clé SQLCipher.
- Le script s’exclut lui-même ; `pnpm-lock.yaml` aussi.
- **Aucune CI** (`.github/` absent) : si le hook ne s’exécute pas, ENF-08 n’a aucun second rideau.
- Les hooks `.githooks/pre-commit` et `pre-push` sont en mode `644` sur ce clone Linux. Git ignore un hook non exécutable. L’incertitude 8 du lead est un **trou de porte réel**, pas un détail cosmétique : secrets et mot interdit peuvent être squishés sur `main` sans aucun contrôle.
- Clé de chiffrement : `DEVELOPMENT_FALLBACK_KEY` est volontairement non secrète et refusée si `TENU_ENV=production`. Conforme à ENF-08. U4 ne doit pas committer de vraie clé, ni la journaliser.

Proposition : l’entretien confirme (a) le bit exécutable versionné des hooks, (b) que `ci-pipeline` relance `check:secrets --all` sur l’arbre suivi, pas seulement le stage. Gitleaks reste optionnel, hors besoin U4.

### Audit des dépendances et chaîne d’approvisionnement

Ce que le lead inscrit est vrai : `pnpm-lock.yaml` committé, `packageManager` figé (`pnpm@10.15.0`), `pnpm audit --audit-level=high` dans le `pre-push`, installation figée prévue pour la CI future.

Ce que le brouillon sous-estime :

- **`vendor/`** : `fast-check` et `pure-rand` sont des tarballs `file:vendor/*.tgz` suivis par git (SHA-256 observés : `da0089e3…` / `3ce449c7…`). C’est un contrôle d’approvisionnement (install hors registre pour ces deux paquets) né d’une panne npm en U3. Le lead ne le nomme pas dans `team-practices.md`.
- **Double résolution dans le lockfile** : `pure-rand@file:vendor/pure-rand-8.4.2.tgz` **et** `pure-rand@8.4.2` (registre). Aucun `pnpm.overrides`. Un `pnpm install --frozen-lockfile` hors ligne peut encore exiger le registre pour la dépendance transitive de `fast-check`. La vendorisation n’est donc pas une chaîne fermée.
- Pas de SBOM, pas de pin d’intégrité npm au-delà du lockfile, pas d’`.npmrc` d’overrides.
- L’audit `high` laisse passer les CVE moderate ; c’est la pratique déjà posée dans le hook, à garder sauf objection humaine.
- `apps/pc-proof/out/` n’est pas dans `.gitignore` à la racine ; un `main.cjs` généré apparaît modifié. Du binaire de build dans le dépôt élargit la surface d’approvisionnement. U4 doit ignorer `out/` (ou le régénérer uniquement en CI / empaquetage), pas le traiter comme source.

Proposition Code Style / Testing Posture : documenter `vendor/` comme exception nommée (deux tarballs de test, hashés par le lockfile) ; l’entretien dit si on ajoute `pnpm.overrides` pour forcer `pure-rand` en `file:`. Ne pas vendoriser un OCR tiers de la même façon sans ADR + hash.

### Electron durci (ne pas l’assouplir pour U4)

Constat aligné avec le lead et `team.md` : `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webSecurity`, pas de `<webview>`, navigation `file:` uniquement, CSP `default-src 'none'` puis allowlist, **`connect-src 'none'`**, permissions **toutes refusées** (caméra comprise), pont IPC à trois canaux Zod, plafond `MAX_PAYLOAD_BYTES = 64 KiB`, canal inconnu refusé.

Implications U4 que le brouillon dilue :

1. **Photo = fichier déjà sur le PC (CT-04), pas webcam.** Garder le refus global des permissions. Ne pas ouvrir la caméra « au cas où ».
2. **Ne pas faire d’HTTPS depuis le renderer.** `connect-src 'none'` l’interdit aujourd’hui. Un appel réseau, s’il existe un jour, vit dans le processus principal, derrière un adaptateur, jamais dans l’interface. Relâcher la CSP du renderer pour l’OCR serait un assouplissement de la politique que le lead prétend ne pas assouplir.
3. **IPC : passer un chemin de fichier, jamais les octets de l’image.** 64 KiB ne tient pas une photo de registre. Zod sur la photo = schéma du **chemin / mime / taille**, pas un blob dans le pont.
4. L’écran de vérification photo masque prix d’achat / CUMP / marge au vendeur (CT-09) : c’est le même filtrage de rôle que le catalogue, pas un canal IPC « debug » qui fuit les coûts.

La phrase actuelle de Code Style (« U4 n’assouplit pas cette politique ; un appel HTTPS, s’il est retenu pour la photo, ne concerne que l’import d’image ») est **ambiguë**. Elle laisse croire qu’on peut ouvrir le réseau dans l’UI sans changer la politique. À réécrire : métier de caisse hors ligne ; reconnaissance éventuellement dans le main ; renderer inchangé.

### U4 OCR / photo — prix d’achat jamais chez un tiers

Ce n’est pas une idée d’agent. C’est déjà une décision humaine de **cette** intention :

- D-INT-07 : preuve de concept OCR dans U4 ; **prix d’achat jamais chez un tiers**
- CR-01 : les prix d’achat ne sont jamais transmis à un service tiers
- CR-02 : **aucune image envoyée à un tiers** tant qu’un spécimen du registre n’a pas été vu
- Périmètre : sans spécimen, on fige la voie **sur l’appareil** ; un service tiers n’est pas retenu

Le lead range cela en incertitude 10 (« pas une nouvelle règle ALWAYS/NEVER tant que l’humain ne l’énonce pas »). Objection : l’humain l’a déjà énoncé en idéation. `discovered-rules.md` recopie `project.md` (2026-09-17) et **omet** CR-01 / CR-02. ENF-08 interdit de *journaliser* un prix d’achat ; il n’interdit pas de *l’envoyer* dans une image. Une photo de registre peut porter les coûts même si l’API n’a pas de champ `purchase_price`.

À proposer à l’entretien (formulation NEVER, pas une pratique molle) :

- NEVER envoyer une image, un extrait OCR, un prix d’achat, un CUMP ou une marge à un service tiers. [CR-01, CR-02, D-INT-07]
- ALWAYS figer la reconnaissance sur l’appareil tant qu’un spécimen n’a pas montré l’absence de prix d’achat sur le papier. [CR-02]

Tant que C4 n’est pas ouvert, C1–C3 n’ont aucun appel réseau. Ne pas créer de canal HTTPS « provisoire » pendant la preuve de concept.

### Alignement avec `team.md`

Les portes locales (secrets + mot interdit avant commit ; typecheck / lint / test / audit high avant push), Electron durci, Zod aux frontières, couverture bloquante, fusion locale sans PR : **reprendre telles quelles**. U4 n’introduit ni AWS, ni secrets de serveur, ni DAST, ni CI GitHub tant que `ci-pipeline` ne les pose pas. La CI distante reste un second rideau, pas un remplacement des hooks — à condition que les hooks s’exécutent vraiment.

## Positions

- AGREE: portes git versionnées (secrets + ENF-14 en pre-commit ; typecheck, lint, test, `pnpm audit --audit-level=high` en pre-push) — observées dans `.githooks/` et alignées sur `team.md`.
- AGREE: lint/format à la racine (Prettier + ESLint typé) comme unique SAST actuel — suffisant pour U4 ; Semgrep / Authenticode / Stryker hors besoin sauf objection humaine.
- AGREE: absence de CI GitHub et de DAST — reportée à `ci-pipeline` / hors U4 ; les hooks locaux restent la porte de fusion.
- AGREE: Electron durci (`security.ts`, CSP `connect-src 'none'`, sandbox, pont Zod) conservé ; C1 n’est pas la photo.
- AGREE: lockfile committé + `packageManager` figé + audit `high` comme contrôle de dépendances.
- OBJECT: bit exécutable des hooks `644` — sur Linux les portes ENF-08 / ENF-14 / audit peuvent ne jamais tourner ; l’entretien doit trancher un hook exécutable versionné, pas seulement « confirmer ».
- OBJECT: phrase HTTPS photo vs « politique non assouplie » — un appel réseau dans le renderer contredit `connect-src 'none'` ; l’OCR, s’il existe, reste dans le processus principal, image = chemin fichier, pas d’octets IPC (plafond 64 KiB), caméra toujours refusée (CT-04).
- OBJECT: CR-01 / CR-02 / D-INT-07 absents de `discovered-rules.md` — l’humain a déjà interdit prix d’achat et image chez un tiers ; ce n’est pas une règle à inventer plus tard, c’est une promotion à confirmer à l’entretien.
- OBJECT: chaîne `vendor/` incomplète dans le brouillon — tarballs `file:` suivis, mais `pure-rand@8.4.2` reste résolu depuis le registre ; sans `overrides`, l’install figée hors ligne n’est pas garantie.

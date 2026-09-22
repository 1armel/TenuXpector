# Preuves — découverte des pratiques (U4 Catalogue)

> Intégration après entretien. Brouillon lead, trois contributions support
> (lues, non réécrites), réponses Q1–Q6 confirmées « Looks correct ».

## Contexte

- Intention `260921-u4-catalog`, type **brownfield**. L'ingénierie inverse est
  SKIP pour ce flux : pas d'artefacts `code-structure` / `technology-stack` à
  exiger. Le code u1–u3 dans le dépôt en tient lieu.
- Relance : `aidlc/spaces/default/memory/team.md` et `project.md` sont déjà
  peuplés (affirmation du 2026-09-17, intention `260916-caisse-hors-ligne-3`).
  C'est la baseline, pas une feuille blanche.
- Scope `spec-driven-dual-target-ops` : `skeleton: on`, `change_control: strict`,
  profondeur et stratégie de test `Comprehensive`.
- Unité visée : U4 Catalogue (FR3.1–FR3.8), embarquée dans la caisse déjà
  livrée. Hors U4 : vente/encaissement/clôture, impression, app propriétaire,
  serveur, AWS, UI tablette.

## Ce que chaque participant a inspecté

| Participant | Sources inspectées | Apport principal |
|---|---|---|
| Lead `aidlc-pipeline-deploy-agent` | Git (`main`, 8 commits), `.githooks/`, `package.json`, `vitest.config.ts`, Playwright, ESLint/Prettier/`tsconfig`, `CLAUDE.md`, `apps/pc-proof`, `packages/{domain,db}`, schéma, ADR, glossaire, `aidlc-state.md`, note d'initiative / périmètre U4 | Brouillon des cinq sections ; écarts baseline vs dépôt ; 11 incertitudes d'entretien |
| `aidlc-quality-agent` | Brouillon, `team.md`, `vitest.config.ts`, scripts de test, Playwright, résilience, tests catalogue dans `db`, exigences ENF-01/02/11/16 | Posture `custom` conservée ; 90 % domain = CLI `test:domain` seulement ; hooks `644` morts sur Linux ; ENF-16 = chronométrage opérateur, pas Playwright ; ENF-02 à nommer pour C1 |
| `aidlc-developer-agent` | `packages/domain`, `packages/db`, `apps/pc-proof`, ESLint, `tsconfig`, `CLAUDE.md`, `team.md` Code Style | Règles catalogue aujourd'hui dans `db` ; freeze des noms persistés ; U4 écrit dans `apps/pc-proof` ; ESLint domain n'interdit pas `@tenu/db` ; deux enveloppes `Result` |
| `aidlc-devsecops-agent` | Hooks, scripts secrets / mot interdit, lockfile, `vendor/`, `security.ts`, pont IPC, CR-01 / CR-02 / D-INT-07 | Bit `+x` des hooks ; NEVER photo/prix chez un tiers ; réseau hors renderer ; `vendor/` incomplet ; pas de DAST ni Semgrep pour U4 |

## Décisions de l'entretien

Source : `practices-discovery-questions.md`, résumé consolidé confirmé par « Looks correct ».

| Question | Réponse | Décision |
|---|---|---|
| Q1 Branches | A | Inchangé : `main` unique, branche courte par tranche, squash local, Conventional Commits avec identifiants d'exigence |
| Q2 Première tranche | A | C1 (fiche + recherche + rôles) dans l'app de caisse existante (`apps/pc-proof`) ; approbation avant C2–C4 ; cérémonie `skeleton: on` conservée |
| Q3 Tests | A | Posture actuelle conservée ; règles catalogue en TDD dans `domain` ; ENF-16 chronométré (pas Playwright) ; ENF-02 visé à J1 ; e2e créer / retrouver / masquer les coûts à J1, pas bloquant à chaque fusion |
| Q4 Hooks | A | Rendre `.githooks` exécutables et vérifier qu'ils partent avant le premier Bolt U4. Pas de CI GitHub maintenant (option C écartée) |
| Q5 Code catalogue | A | Règles métier catalogue dans `packages/domain` (tests d'abord) ; UI dans `apps/pc-proof` ; noms de tables/colonnes déjà en base inchangés ; identifiants nouveaux en anglais |
| Q6 Photo / réseau | A | NEVER envoyer une image du registre ni un prix d'achat à un tiers tant que le spécimen n'est pas vu ; un éventuel appel réseau reste hors de l'interface (processus principal) |

## Positions des contributions : intégrées ou laissées ouvertes

| Position | Contribution | Sort |
|---|---|---|
| Methodology `custom` + Ordering mixte ; règles catalogue = métier TDD domain | qualité (AGREE) | Intégrée (Q3, Q5) |
| Seuils 90/80, Comprehensive, fast-check entiers, CI distante plus tard | qualité (AGREE) | Intégrée ; 90 % corrigé comme drapeaux `test:domain`, 80 % dans `vitest.config.ts` |
| E2E ENF-11 caisse complet non bloquant pour U4 | qualité (AGREE) | Intégrée (Q3) |
| « Playwright mesure ENF-16 » est faux | qualité (OBJECT) | Tranché par Q3 A : ENF-16 = chronométrage opérateur ; Playwright = e2e + latences UI |
| Seuils « dans vitest.config.ts et test:domain » + hooks présentés comme vivants | qualité (OBJECT) | Intégré : lieu réel des seuils ; Q4 A rend les hooks exécutables avant le premier Bolt |
| E2E C1 bloquant à chaque fusion | qualité (question) | **Tranché** : à J1, pas bloquant à chaque fusion (Q3 A) |
| Baseline Code Style + `apps/pc-proof` + glossaire U4 + Zod aux nouvelles frontières | développeur (AGREE) | Intégrée (Q5) |
| Ne pas inventer de ALWAYS/NEVER au-delà de l'humain | développeur (AGREE) | Respecté ; seule addition = Q6 |
| Deux enveloppes `Result` (`error` vs `code`+`message`) | développeur (OBJECT) | **Laissé ouvert** : l'entretien ne l'a pas posé ; détail de Construction, pas une règle d'équipe |
| Règles catalogue aujourd'hui dans `db` | développeur (OBJECT) | Tranché par Q5 A : nouvelles règles dans `domain`, `db` reste adaptateur |
| ESLint domain omet `@tenu/db` | développeur (OBJECT) | Intégré comme pratique à fermer avant la première fiche ; pas de NEVER inventé |
| Geler les énumérations persistées ; anglais pour le code nouveau | développeur (OBJECT sur le binaire aligner/geler) | Tranché par Q5 A, dans ce sens |
| `discovered-rules` dit `apps/caisse` | développeur (OBJECT) | ALWAYS CLAUDE.md conservé (pas inventé) ; Code Style affirme que U4 écrit uniquement dans `apps/pc-proof` |
| Portes git, lint comme SAST, pas de DAST, Electron durci, lockfile + audit `high` | sécurité (AGREE) | Intégrée |
| Hooks `644` = trou de porte réel | sécurité (OBJECT) | Tranché par Q4 A |
| Phrase HTTPS photo ambiguë vs `connect-src 'none'` | sécurité (OBJECT) | Tranché par Q6 A : réseau hors renderer ; Code Style réécrit |
| CR-01 / CR-02 absents des NEVER | sécurité (OBJECT) | Tranché par Q6 A ; formulation humaine (image + prix d'achat), sans étendre à CUMP / marge / extrait OCR |
| `vendor/` incomplet (`pure-rand` encore au registre) | sécurité (OBJECT) | Consigné en pratique observée et en incertitude ; l'entretien n'a pas demandé `pnpm.overrides` |

## Arbitrages du lead à l'intégration

- **Q6 seulement comme NEVER nouveau.** L'entretien a énoncé une contrainte dure ; on ne promeut pas l'ALWAYS « figer la reconnaissance sur l'appareil » proposé par la sécurité (déjà dans le périmètre, pas choisi comme ALWAYS). On n'ajoute pas CUMP, marge ni extrait OCR à la formulation humaine.
- **ALWAYS `apps/caisse` conservé.** C'est `CLAUDE.md`, déjà affirmé. Le risque de scaffold est traité dans `team-practices.md` (chemin réel `apps/pc-proof`), pas par une NEVER inventée.
- **90 % domain.** Fait observé, pas un nouveau seuil : le script `test:domain` porte les drapeaux ; `vitest.config.ts` porte les 80 %.
- **Enveloppe Result.** Non demandée à l'entretien → incertitude de Construction, pas une règle.

## Reverse-engineering

SKIP pour cette intention. Aucun artefact d'ingénierie inverse n'est requis ni attendu. Le code `apps/pc-proof`, `packages/domain` et `packages/db` a été lu à la place.

## Incertitudes restantes

- **Forme de l'enveloppe Result** (domaine/`db` : `{ ok, error }` ; IPC : `{ ok, code, message }`). Mapping à poser en Construction, pas une pratique d'équipe tant que l'humain ne l'a pas tranché.
- **`pnpm.overrides` pour `pure-rand` en `file:`** : vendorisation actuelle incomplète ; hors entretien.
- **`format:check` hors `pre-push`** : un fichier mal formaté peut fusionner ; l'entretien n'a pas ajouté cette porte.
- **Playwright `test.skip` sans binaire Electron** : acceptable tant que l'e2e catalogue n'est pas dans `pnpm test` (Q3 A : J1, pas fusion). Si un e2e devient bloquant plus tard, le skip silencieux devrait devenir un échec.
- **Seuil 90 % figé dans une config Vitest domain** plutôt que CLI : proposé par la qualité, non demandé.
- **Seed ENF-02 à 10 000 articles** (aujourd'hui ~200) : visé à J1, volume exact du jeu de perf à caler en Construction.
- **IPC photo = chemin fichier, pas octets** (plafond 64 KiB) : implication du durcissement observé, pas une règle ALWAYS/NEVER.
- **Langue des messages de commit** : toujours non tranchée (exemple `CLAUDE.md` en français, code en anglais).
- **Signature Authenticode, Semgrep, Stryker, Gitleaks, graphe de dépendances complet** : toujours hors besoin U4 sauf objection humaine.
- **`apps/pc-proof/out/` suivi par git** : surface d'approvisionnement ; à ignorer ou régénérer, pas tranché à l'entretien.

**Collaborator:** aidlc-developer-agent

## Contribution

> Revue de soutien à l'aveugle, angle développeur : nommage, frontières de couches, gestion des erreurs,
> organisation des fichiers, style de code, granularité des commits et branches.
> Sources lues : `CLAUDE.md` (racine), `docs/exigences-tenuxpector.md` (§1.4, §4 DEC-02/04/11, EF-U0-01/02/05/07/08, U1, EF-U4-06, EF-U6-02, §8), `docs/specifications.md` (§2.6 interface de transport, arborescence, bloc CLAUDE.md d'origine), brouillon du lead.
> Rien de ce qui suit n'est affirmé : ce sont des constats sourcés et des propositions à trancher à l'entretien.

### 1. Nommage — ce que les exigences montrent réellement

Le brouillon qualifie le nommage français de « déduit ». La déduction est solide, mais la convention observée est **mixte et plus précise** que « identifiants en français ». Relevé exhaustif des formes qui apparaissent dans les documents qui font foi :

| Élément | Exemples sourcés | Forme observée |
|---|---|---|
| Fonctions du domaine | `quantiteStock`, `etatStockAu`, `versUniteBase`, `evaluerAlertes`, `evaluerAlertesPeriodiques`, `rapportJournalier` (U1) | français, camelCase, verbe ou nom métier |
| Types du domaine | `Alerte`, `Rapport` (EF-U1-09/10), `EvenementSortant`, `EvenementEntrant`, `Curseur`, `AccuseReception` (spécifications §2.6) | français, PascalCase |
| Interfaces d'adaptateur | `Imprimante` (EF-U4-06), `SyncTransport` (EF-U6-02) | **mixte** : métier en français, suffixe technique en anglais |
| Implémentations d'adaptateur | `HttpServerTransport`, `LocalPeerTransport`, `FileTransport` (EF-U6-10/11/12) | **anglais** (vocabulaire technique) |
| Membres d'interface | `nom`, `disponible()`, `pousser()`, `tirer()` (spécifications §2.6) | français |
| Tables et colonnes | `mouvements_stock`, `curseurs_sync`, `derniere_sequence_envoyee`, `quantite_base`, `date_operation` | français, snake_case |
| Valeurs d'énumération | `AJUSTEMENT_INVENTAIRE` (EF-U2-03) ; `gerant`, `credit` (rôles, moyens de paiement) | **deux formes** : MAJUSCULES_SNAKE pour les types de mouvement, minuscules pour rôles et moyens de paiement |
| Clés de paramètres | `caisse.tiroir_present`, `tva.taux_pb`, `sync.derive_horloge_min`, `caisse.verrouillage_inactivite_s` | `domaine.cle_snake`, **unité en suffixe** (`_pb`, `_min`, `_s`) |
| Commandes racine | `recalculer-stock`, `migrate`, `seed` (EF-U0-01) | **mixte** : kebab-case, français pour le métier, anglais pour l'outillage |

Constat important : **aucun identifiant ne porte d'accent** (`gerant`, `derniere`, `operation`, `quantite`), et l'exemple de commit de `CLAUDE.md` est lui aussi sans accent (`cloture a l'aveugle`). C'est une convention implicite cohérente, à rendre explicite.

Proposition de règle de nommage à soumettre à l'entretien (Q-D1) :

- Le **vocabulaire métier** est en français (le glossaire §3 des exigences fait référence) ; le **vocabulaire technique** reste en anglais quand il nomme un rôle d'architecture (`Transport`, `Adapter`, `Repository`, `use…` pour les hooks React, `describe`/`it` imposés par l'outil).
- **Identifiants en ASCII strict** : aucun accent dans les noms de variables, fonctions, types, fichiers, tables, colonnes, clés de paramètres, branches. Les accents restent dans les chaînes affichées à l'utilisateur. Justification technique : fichiers et branches sur Windows, outils de recherche, et le lanceur `aidlc.cmd` qui coupe déjà les arguments accentués sur ce poste.
- TypeScript : camelCase (valeurs, fonctions), PascalCase (types, interfaces, composants React), pas de préfixe `I` sur les interfaces.
- Schéma : snake_case français au pluriel pour les tables (déjà le cas partout).
- **Unités dans les noms** : quand une grandeur entière n'est pas typée par un type marqué (voir §5), son nom porte l'unité, sur le modèle des clés de paramètres : `tauxPb`, `delaiMin`, `cumpMilliFcfa`. Les montants en FCFA entiers et les quantités en millièmes (DEC-04) sont les cas à trancher : suffixe systématique, ou types marqués qui rendent le suffixe inutile.

**Tension à trancher (Q-D2) — casse des champs dans le domaine.** EF-U1-01 et EF-U1-02 nomment les champs lus par les fonctions pures en snake_case (`quantite_base`, `date_operation`), alors que les fonctions sont en camelCase. Deux options :
- A. Les types du domaine gardent les noms de colonnes (snake_case) : aucune correspondance à maintenir entre base et domaine, mais deux casses coexistent dans le code TypeScript et le lint de nommage doit l'autoriser.
- B. Le domaine est entièrement en camelCase (`quantiteBase`, `dateOperation`) et la couche `packages/db` fait la correspondance (l'ORM la fait nativement) : code homogène, mais les critères d'acceptation des exigences citent des noms de champs qui ne seront pas littéralement dans le code.
Recommandation développeur : **B**, avec la correspondance centralisée dans `packages/db` et une note dans l'ADR du schéma. Décision humaine requise, car elle touche la lecture littérale d'un document qui fait foi.

**Valeurs d'énumération (Q-D3)** : unifier (tout en minuscules snake, par exemple `ajustement_inventaire`, `gerant`) ou conserver les deux formes vues dans les exigences. Recommandation : conserver **exactement** les valeurs écrites dans les exigences, car elles sont stockées en base et citées dans les critères d'acceptation ; ne pas les renommer.

### 2. Organisation des fichiers

Aucune convention de nom de fichier n'existe dans les sources. Propositions (Q-D4) :

- **Noms de fichiers et de dossiers en kebab-case ASCII**, y compris pour les composants React (`ecran-cloture.tsx` exporte `EcranCloture`). Justification : Windows (poste du développeur) est insensible à la casse et git ne l'est pas ; un renommage `Cloture.tsx` → `cloture.tsx` y casse silencieusement l'index. L'alternative PascalCase pour les `.tsx` est courante ; elle se paie par ce risque.
- **Un module par règle ou groupe de règles du domaine**, nommé d'après le concept métier (`packages/domain/src/stock/cump.ts`, `.../tarification/ligne.ts`, `.../alertes/evaluer-alertes.ts`), avec un point d'entrée `src/index.ts` par paquet qui fixe l'API publique ; les autres paquets n'importent que ce point d'entrée (pas d'import profond `@tenu/domain/src/...`).
- **Tests colocalisés** : `cump.test.ts` à côté de `cump.ts` ; tests de propriétés (EF-U1-11) suffixés `.prop.test.ts` ; E2E Playwright dans un dossier dédié (`e2e/` à la racine ou par application, à trancher avec l'agent qualité). Chaque fichier de test cite ses identifiants dans le `describe` (`describe('RG-11 CUMP [EF-U1-03]', …)`), ce qui rend la règle « citer les identifiants dans les tests » vérifiable par une simple recherche.
- **Nom de portée des paquets** : un préfixe npm interne unique (`@tenu/domain`, `@tenu/db`…). Le mot interdit par ENF-14 ne doit évidemment pas y figurer. Nom exact à trancher.
- **ADR** : `docs/adr/NNNN-titre-kebab.md` (numéro à quatre chiffres), un ADR par décision DEC-xx rédigée pendant U0.

**Tension à trancher (Q-D5) — où vit l'empaquetage des deux cibles.** DEC-02 dit : « `apps/caisse` porte le code partagé ; l'empaquetage vit dans **deux dossiers distincts** et ne contient aucune règle métier ». EF-U0-01 fixe la liste `apps/{api,caisse,proprietaire}` sans ces deux dossiers. Options :
- A. `apps/caisse` (React, lecture locale, interfaces d'adaptateur) + `apps/caisse-electron` + `apps/caisse-android` (plus tard) : trois paquets pnpm, frontières contrôlables par le lint, mais la liste d'EF-U0-01 est étendue.
- B. `apps/caisse/electron/` et `apps/caisse/android/` à l'intérieur d'un même paquet : liste d'EF-U0-01 respectée à la lettre, mais la frontière « aucune règle métier dans l'empaquetage » ne peut plus s'appuyer sur les dépendances du paquet.
Recommandation développeur : **A**, avec une correction explicite d'EF-U0-01 pendant l'analyse des exigences (comme I-01 à I-03). Seul `caisse-electron` est créé maintenant (PC d'abord, I-02).

### 3. Frontières de couches et place des adaptateurs

Le brouillon reprend la règle de `CLAUDE.md` sur `packages/domain` mais ne dit rien de `packages/db` ni de `packages/shared`, ni du **sens des dépendances**. Proposition de graphe autorisé (Q-D6), une flèche = « peut importer » :

```
packages/shared   → (zod uniquement)
packages/domain   → packages/shared ? (à trancher : types et schémas purs seulement) ; aucune autre dépendance
packages/db       → shared, domain
packages/sync     → shared, domain ; PAS db directement si l'outbox est lue via une interface injectée (à trancher)
apps/caisse       → shared, domain, db, sync  (déclare les interfaces d'adaptateur : Imprimante, BaseLocale, …)
apps/caisse-electron → apps/caisse + implémentations (SQLCipher, ESC/POS USB, alimentation)
apps/api          → shared, domain, db, sync
apps/proprietaire → shared (+ client HTTP de l'API) ; JAMAIS db ni la base locale de caisse
```

Points précis :

- **Pureté effective de `domain`**, au-delà des dépendances : aucune lecture d'horloge (`Date.now()`, `new Date()` sans argument), aucune génération d'aléa ni d'UUID, aucune lecture de variable d'environnement, aucun `console`. L'heure courante, les identifiants UUID v7 (EF-U0-05) et les `parametres` sont **passés en arguments**. C'est ce qui rend possibles les tests de propriétés d'EF-U1-11 et l'alerte d'horloge AL-19. À écrire comme règle, car « sans dépendance à une base, un framework UI ou le réseau » ne l'implique pas.
- **Interfaces d'adaptateur côté consommateur** : `Imprimante` (EF-U4-06) et l'interface d'accès à la base locale sont déclarées là où elles sont utilisées (`apps/caisse`), `SyncTransport` dans `packages/sync` (EF-U6-02). Les implémentations vivent dans l'empaquetage de la cible, plus une **implémentation d'aperçu ou en mémoire** dans les tests (exigée par EF-U4-06 pour l'imprimante ; même principe recommandé pour la base et le transport).
- **Electron** : la base chiffrée et l'USB ne sont accessibles que depuis le processus principal ; l'interface React y accède par un pont IPC typé et validé par Zod (frontière au sens de `CLAUDE.md`). La même interface d'adaptateur sera réimplémentée par Capacitor sans toucher `apps/caisse`. Le détail de sécurité (isolation de contexte) relève de l'agent devsecops.
- **Contrôle mécanique** : la règle `NEVER faire dépendre packages/domain d'une base, d'un framework UI ou du réseau` de `discovered-rules.md` n'est tenable dans la durée que si elle est vérifiée par `pnpm lint`. Options : `no-restricted-imports` d'ESLint par paquet (simple, sans dépendance), ou un outil de graphe de dépendances (dependency-cruiser, eslint-plugin-boundaries) qui couvre tout le graphe ci-dessus. Recommandation : `no-restricted-imports` pour `domain` dès U0 (liste d'interdits : pilotes SQLite/PostgreSQL, ORM, `react`, `electron`, `@capacitor/*`, `node:fs`, `node:net`, `node:http`, `fetch` global via règle `no-restricted-globals`), et un contrôle du graphe complet à décider (Q-D6).

### 4. Gestion des erreurs

Rien n'est dit dans les sources, alors que plusieurs exigences imposent un comportement précis : ligne d'import en erreur qui n'empêche pas les autres (EF-U2-03), imprimante absente qui ne bloque jamais une vente (DEC-11, EF-U4-04), somme des paiements insuffisante refusée (EF-U1-07), trigger qui lève une erreur sur UPDATE (EF-U0-03). Proposition de convention (Q-D7), en deux régimes :

- **Issues métier attendues → valeurs de retour, jamais d'exception.** Une fonction du domaine qui peut refuser retourne une union discriminée, par exemple `{ ok: true; valeur: T } | { ok: false; erreur: { code: 'PAIEMENT_INSUFFISANT'; manque: number } }`. Le compilateur force l'appelant à traiter le refus. Un avertissement qui n'est pas un refus (prix sous le plancher, stock négatif DEC-03) est une **donnée du résultat** (indicateur, alerte), pas une erreur.
- **Violations d'invariant ou erreurs de programmation → exception immédiate** (`throw`), jamais rattrapée pour être ignorée : montant non entier, quantité négative là où c'est impossible, session de caisse absente. Échouer fort, conformément au garde-fou de construction.
- **Codes d'erreur stables** en MAJUSCULES_SNAKE ASCII, sans texte d'interface dans `domain` ; le **message français** est produit par l'interface à partir du code (ENF-07, « interface en français »). Cela garde `domain` indépendant de l'UI et rend les codes testables.
- **Aux frontières** (import, IPC, API, lecture de `parametres`) : `schema.safeParse()` de Zod, converti en résultat d'erreur portant le chemin du champ ; jamais `parse()` qui lève dans un parcours utilisateur. Pour l'import (EF-U2-03), une erreur par ligne s'accumule dans le rapport au lieu d'interrompre.
- **Adaptateurs d'I/O** (base, imprimante, transport) : ils rattrapent les erreurs techniques et les **journalisent** (sans PIN, prix d'achat ni jeton, ENF-08), puis les traduisent en résultat. Classement explicite : récupérable (imprimante absente → vente enregistrée, réimpression proposée ; transport indisponible → l'outbox attend) ou fatal (base illisible, migration échouée → arrêt avec message).
- **Promesses** : aucune promesse flottante ni `catch` vide ; à imposer par lint (voir §5).
- Choix de bibliothèque : type résultat maison de quelques lignes dans `packages/shared` (recommandé, aucune dépendance) ou bibliothèque dédiée ; à trancher.

### 5. Formatage, lint et configuration TypeScript

`org.md` renvoie à la configuration du dépôt, qui n'existe pas encore : le choix revient donc entièrement à l'humain. Proposition détaillée, à créer pendant U0 (Q-D8) :

- **Formatage** : Prettier, configuration minimale à la racine (largeur, guillemets simples ou doubles, virgules finales) ; aucune règle de style dans ESLint (`eslint-config-prettier`). Les valeurs exactes sont un choix de goût : une seule question à l'entretien suffit (« valeurs par défaut de Prettier : oui/non »).
- **Lint** : ESLint en configuration plate (`eslint.config.js`) avec les préréglages **typés** stricts de typescript-eslint. Règles à mettre en **erreur** : `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check` (indispensable avec les unions discriminées du §4), `ban-ts-comment` (pas de `@ts-ignore`), `no-non-null-assertion`, plus les `no-restricted-imports` du §3.
- **Alternative Biome** (formatage et lint en un outil, plus rapide) : à évaluer, mais vérifier qu'elle couvre les règles typées ci-dessus (promesses flottantes, exhaustivité) avant de la retenir ; si elle ne les couvre pas, la garantie « aucun `any` / aucune erreur ignorée » s'affaiblit.
- **`tsconfig` de base partagé** : `strict: true` (exigé), et à trancher en plus : `noUncheckedIndexedAccess` (fortement recommandé : les accès par index sur les lignes de vente et les unités deviennent sûrs), `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`. Ces options coûtent peu sur un projet greenfield et beaucoup à ajouter plus tard.
- **Flottants (DEC-04)** : le lint ne peut pas prouver l'absence de flottant. Deux leviers à trancher : types marqués (`type Fcfa = number & { readonly __unite: 'FCFA' }`, avec constructeurs qui vérifient `Number.isSafeInteger`) ou simple convention de suffixe de nom (§1). Recommandation : types marqués dans `domain`, construits aux frontières, plus une règle ESLint interdisant `/` hors du module d'arrondi (RG-01) si elle reste simple à maintenir.
- **Contrôle du mot interdit (ENF-14)** : pas une règle ESLint (elle ne voit ni SQL, ni JSON, ni CSS) mais un petit script lancé par `pnpm lint`, sur une **liste d'inclusion** (`packages/`, `apps/`) en excluant explicitement le seed ; une liste d'exclusion finirait par attraper `aidlc/` et `CLAUDE.md` (tension T4 du lead).

### 6. Commits et branches pour un développeur seul

La tension T2 du lead se résout sans contredire `CLAUDE.md` : la règle est « une unité **ou fonctionnalité** par branche », ce qui autorise une branche par **Bolt**. Proposition (Q-D9) :

- **Une branche par Bolt**, nommée `<type>/<unite>-<sujet>` en kebab-case ASCII : `feat/u1-cump`, `feat/u3-cloture-aveugle`, `chore/u0-monorepo`. Une unité entière sur une seule branche longue (plusieurs semaines) contredirait `org.md` et accumulerait un écart difficile à fusionner avec les Bolts parallèles.
- **Commits intermédiaires libres sur la branche** ; le commit de squash sur `main` est le seul qui doit respecter Conventional Commits avec identifiants.
- **Portées de commit = nom du paquet ou de l'application** : `domain`, `db`, `shared`, `sync`, `api`, `caisse`, `caisse-electron`, `proprietaire`, plus `adr`, `deps`, `outillage`. Liste fermée, vérifiable par commitlint si un hook est retenu.
- **Messages en ASCII sans accent** comme l'exemple de `CLAUDE.md`, ou accents autorisés : à trancher (le lanceur local tronque les arguments accentués, ce qui plaide pour ASCII).
- Pull request ou fusion locale : sans relecteur humain, la pull request n'apporte qu'une trace et un point d'accroche pour une future CI ; décision humaine (question 4 du lead).

### 7. Décisions de style de code à faire trancher par l'humain (liste consolidée)

| ID | Décision | Recommandation développeur |
|---|---|---|
| Q-D1 | Métier en français, technique en anglais, identifiants ASCII sans accent | Oui |
| Q-D2 | Casse des champs dans les types du domaine : snake_case (comme EF-U1-01) ou camelCase avec correspondance dans `db` | camelCase + correspondance dans `db` |
| Q-D3 | Valeurs d'énumération : conserver exactement celles des exigences | Oui |
| Q-D4 | Fichiers en kebab-case (y compris `.tsx`), tests colocalisés, API publique par `index.ts`, préfixe npm des paquets | Oui ; préfixe à nommer |
| Q-D5 | Empaquetage des cibles : paquets frères `apps/caisse-electron` (+ `caisse-android` plus tard) ou sous-dossiers de `apps/caisse` | Paquets frères, avec correction d'EF-U0-01 |
| Q-D6 | Graphe de dépendances autorisé ; `domain` peut-il importer `shared` ; contrôle par `no-restricted-imports` seul ou par un outil de graphe | Graphe du §3 ; `no-restricted-imports` dès U0 |
| Q-D7 | Erreurs : résultats typés pour le métier, exceptions pour les invariants, codes stables, messages français dans l'UI | Oui |
| Q-D8 | Prettier + ESLint typé strict (ou Biome) ; options `tsconfig` supplémentaires ; types marqués pour DEC-04 | Prettier + ESLint ; `noUncheckedIndexedAccess` ; types marqués |
| Q-D9 | Branche par Bolt, portées de commit fermées, messages ASCII | Oui |

## Positions

- AGREE: Garder le nommage français dans `team-practices.md` et hors de `discovered-rules.md` — aucune personne ne l'a énoncé comme règle ; c'est une convention observée, donc révisable.
- OBJECT: La ligne « Nommage » du brouillon (`## Code Style`) est trop sommaire pour guider la génération de code — elle omet la règle ASCII sans accent, le vocabulaire technique en anglais déjà présent dans les exigences (`HttpServerTransport`, `SyncTransport`), les clés de paramètres à suffixe d'unité, et la contradiction de casse entre `quantite_base` (EF-U1-01) et le camelCase annoncé ; intégrer le §1 et les questions Q-D1 à Q-D3.
- OBJECT: `## Code Style` ne contient aucune convention de gestion des erreurs ni d'organisation des fichiers — plusieurs exigences (EF-U2-03, EF-U4-04, EF-U1-07, DEC-11) imposent un comportement d'erreur précis, et sans convention chaque Bolt en inventera une ; ajouter les §2 et §4 comme propositions à confirmer.
- OBJECT: La règle « Frontières de couches » ne décrit que `domain`, `sync` et la séparation des deux applications — il manque le sens des dépendances entre `shared`, `db`, `sync` et les applications, la pureté effective de `domain` (horloge, aléa, UUID passés en argument) et la place des adaptateurs Electron puis Capacitor ; voir §3 et la tension Q-D5 entre DEC-02 et EF-U0-01.
- OBJECT: La question 20 du lead présente l'interdiction d'importer une base, une UI ou le réseau depuis `packages/domain` comme une règle de lint optionnelle — c'est l'application mécanique d'une règle `NEVER` déjà retenue dans `discovered-rules.md` ; la question à poser est « quel outil », pas « faut-il ».
- OBJECT: La tension T2 est présentée comme une contradiction entre `org.md` et `CLAUDE.md` — `CLAUDE.md` dit « une unité **ou fonctionnalité** par branche », ce qui autorise une branche par Bolt compatible avec des branches courtes ; reformuler la question 3 en choix de granularité, pas en conflit de règles.
- AGREE: Méthodologie `custom` (tests d'abord dans `domain`, couche par couche ailleurs) — c'est la lecture exacte de `CLAUDE.md` ; le §4 (résultats typés, exceptions d'invariant) s'accorde avec l'écriture des tests d'abord dans `domain`.
- AGREE: Proposition Prettier + ESLint avec typescript-eslint strict, configurés à la racine pendant U0 — à compléter par les règles typées du §5 (`no-floating-promises`, `switch-exhaustiveness-check`) sans lesquelles « échouer fort » et l'exhaustivité des unions ne sont pas garantis.
- AGREE: Tension T4 sur le contrôle ENF-14 — recommander une liste d'inclusion (`packages/`, `apps/`, seed exclu) plutôt qu'une liste d'exclusion, plus robuste face aux futurs dossiers de méthode.

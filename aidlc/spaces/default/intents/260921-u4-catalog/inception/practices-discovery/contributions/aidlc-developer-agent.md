**Collaborator:** aidlc-developer-agent

## Contribution

Relance brownfield, angle développeur : nommage, frontières de couches, erreurs, organisation des fichiers, conventions de style. Comparaison du brouillon lead à `packages/domain`, `packages/db`, `apps/pc-proof`, ESLint / Prettier / `tsconfig.base.json`, `CLAUDE.md` et `aidlc/spaces/default/memory/team.md` (Code Style). Aucune contribution sœur lue. Les quatre artefacts déclarés n'ont pas été modifiés.

### Ce que le dépôt confirme (aligné avec le brouillon)

- **TypeScript strict, aucun `any`.** `tsconfig.base.json` active `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `useUnknownInCatchVariables`. ESLint `strictTypeChecked` + `no-explicit-any` / `no-unsafe-*`. Aucun `any` observé sous `packages/`.
- **Fichiers kebab-case, identifiants mixtes camelCase / PascalCase, SQL snake_case.** Exemples : `stock-ledger.ts`, `ipc-contract.ts`, `identity-service.ts`, `sensitive-data-guard.ts` ; types `ProductInput`, `SellingUnitView` ; colonnes `internal_code`, `floor_price`, `tenant_id`.
- **`packages/domain` est pur.** `package.json` sans dépendance runtime. ESLint `no-restricted-imports` bloque React, Electron, SQLite, `fs`, HTTP/HTTPS, `@tenu/pc-proof`. Fonctions pures, tests dans `packages/domain/tests/`.
- **Zod aux frontières déjà posées.** Pont IPC (`apps/pc-proof/src/shared/ipc-contract.ts`, schémas `.strict()` des deux côtés) et lecture des paramètres (`packages/db/src/settings/defaults.ts`).
- **Erreurs : Result vs exception.** Dans le domaine : union `{ ok: true; value } | { ok: false; error }` (`ok` / `err`) pour un refus attendu (`INVALID_FACTOR`, `INSUFFICIENT_PAYMENT`) ; `throw` pour DEC-04 (non-entier). Dans `db` : mêmes `ok`/`err` pour le PIN ; `TenantIsolationError`, `AppendOnlyViolationError`, `MissingOutboxError` pour un invariant. ESLint `no-empty` refuse un `catch` vide. Aucun `catch {}` observé.
- **Organisation.** Domaine par capacité (`stock-ledger`, `costing`, `pricing`, `sale-calculator`, `cash-session`, `alert-engine`). Persistence par feature (`identity/`, `settings/`, `catalog/`, `seed/`). Caisse Electron par processus (`main` / `preload` / `renderer` / `shared`). Tests en miroir `tests/`, pas collés au fichier source. C'est cohérent ; U4 n'a pas à changer de découpage.
- **Caisse réelle = `apps/pc-proof`.** Pas de `apps/caisse` ni de `apps/proprietaire` ni de `packages/sync`. Table `outbox` déjà dans `packages/db` ; le moteur `SyncTransport` peut attendre U6. Durcissement Electron déjà dans `security.ts` (CSP `connect-src 'none'`, pas de Node dans le renderer).
- **Schéma catalogue déjà anglais.** `products` sans colonne quantité ; `selling_units`, `audit_log`, `outbox`. Le glossaire U1 ne relie pas encore fiche / code interne / plancher / désactivation, alors que ces colonnes existent (`internal_code`, `floor_price`, `active`).
- **Prettier racine** (`.prettierrc.json` : simple quotes, trailing comma, printWidth 100). Les agents doivent lire cette config avant toute suggestion de style.

### Écarts que le brouillon Code Style sous-estime (risque U4)

1. **Trois formes de `Result`, pas une.** Le brouillon parle d'une union discriminée `Result`. Le dépôt en a deux familles incompatibles :
   - domaine et `db` : `{ ok: false, error: E }` ;
   - pont IPC : `{ ok: false, code, message }` (`apps/pc-proof/src/shared/result.ts`).
   U4 enchaînera domaine → `db` → IPC (créer / retrouver une fiche). Sans mapping affirmé, les agents mélangeront `error` et `code`. Proposition : garder `error` (code stable) dans domaine/`db` ; garder `code` + `message` technique à l'IPC ; l'UI traduit le code en français. Ne pas fusionner les types dans U4, les relier.

2. **Les règles catalogue vivent dans `packages/db`, pas dans `packages/domain`.** `catalog/product.ts` (pas de champ quantité, plancher ≤ référence, UUID v7) et `sensitive-data-guard.ts` (masquage vendeur) sont de la logique métier, aujourd'hui par `throw ValidationError` / `throw Error`, sans Zod et sans `Result`. `apps/pc-proof` n'importe pas `@tenu/domain`. La règle ALWAYS « nouvelle règle métier d'abord dans `packages/domain`, tests d'abord » est donc déjà contredite par le code U2. Pour U4 (C1 fiche + rôles), il faut trancher : extraire dans `domain` (prix, masquage, absence de quantité) et laisser `db` comme adaptateur ; ou déclarer ces helpers `db` comme frontière de persistance, pas comme lieu des règles. Recopier la logique dans le renderer serait une régression de couche.

3. **La clôture ESLint du domaine est incomplète.** Elle ne bloque pas `@tenu/db`. Un import `db` depuis `domain` compilerait. Ajouter `@tenu/db` (et tout paquet non pur) à `no-restricted-imports` pendant U4, avant la première fiche.

4. **Nommage bilingue plus large que « quelques fonctions françaises ».**
   - Fichiers et colonnes : anglais (`quantiteStock` vs `quantityBase` vs colonne absente).
   - Fonctions domaine : `quantiteStock`, `etatStockAu`, `versUniteBase`, `evaluerAlertes`, `rapportJournalier`, `arrondir` à côté de `priceLine`, `computeSaleTotals`, `theoreticalCash`, `roundCashToUnit` (le même `rounding.ts` mélange les deux).
   - Énumérations persistées : `StockMovementKind` = `ENTREE_ACHAT`… ; `PaymentMode` = `especes` ; `AlertSeverity` = `haute` ; rôles SQL = `vendeur` | `gerant` | `proprietaire`.
   - Paramètres Zod : `payment_modes: ['cash', 'mobile_money']` — **pas** les mêmes jetons que `PaymentMode` du domaine.
   L'entretien « aligner l'existant ou geler » est trop binaire. Recommandation développeur : **geler les littéraux déjà en base** (rôles, kinds de mouvement — une migration d'énumération n'est pas U4) ; **anglais uniquement pour le code nouveau** (recherche, import, photo, canaux IPC catalogue) ; **étendre le glossaire vers les noms déjà posés** (`internal_code`, `floor_price`, `active`, `maskProductForRole`) au lieu d'en inventer ; **hors U4** : le refactor `quantiteStock` / `ENTREE_ACHAT` / `especes` vs `cash`.

5. **Zod n'est pas le validateur catalogue actuel.** C1/C2 (clavier) et C3 (import) n'ont pas la même frontière. Proposition de convention, à faire confirmer :
   - Zod à l'IPC, à l'import fichier/photo, à la lecture des paramètres (déjà affirmé) ;
   - `Result` dans `domain` pour un refus métier (plancher > référence, code interne vide) ;
   - exception seulement pour un invariant (quantité mutable, tenant, hors-entier DEC-04).
   Ne pas Zod-ifier les fonctions pures du domaine.

6. **`ALWAYS garder apps/proprietaire séparée de apps/caisse` vs le chemin réel.** Le brouillon `team-practices` nomme `apps/pc-proof` ; `discovered-rules` recopie `CLAUDE.md` et parle encore de `apps/caisse`. Un agent de génération de code suivra le ALWAYS et pourra créer `apps/caisse`. Tant que le paquet n'est pas renommé : **tout code caisse U4 va dans `apps/pc-proof`** ; ne pas échafauder `apps/caisse` ni `apps/proprietaire` dans cette intention.

7. **Langue des commentaires.** `team.md` impose l'anglais pour les identifiants, pas pour les commentaires. Aujourd'hui : commentaires français dans ESLint / IPC / `security.ts`, anglais dans `domain` et `db`. Pour U4, commentaires techniques en anglais dans `packages/` et `apps/` ; français réservé aux chaînes UI.

### Organisation U4 proposée (sans nouvelle règle ALWAYS)

```
packages/domain/src/catalog/     règles pures (prix, recherche, masquage rôle)
packages/db/src/catalog/         persistance, déjà présent (product.ts)
apps/pc-proof/src/shared/        schémas Zod des canaux fiche / recherche
apps/pc-proof/src/main/          adaptateurs IPC → db
apps/pc-proof/src/renderer/      UI française, aucun coût pour le vendeur
docs/glossaire-fr-en.md          étendre, ne pas renommer le schéma
docs/adr/                        tout nouvel adaptateur photo / tout changement de schéma
```

`packages/sync` : ne pas le créer pour U4. L'`outbox` transactionnelle existe déjà dans `db`.

## Positions

- AGREE: La baseline Code Style de `team.md` (anglais code / français UI, kebab-case fichiers, TypeScript strict, Zod aux frontières, domaine pur, Result vs exception, Prettier+ESLint lus avant suggestion) est la bonne base ; le dépôt la suit pour le formatage, le lint, le SQL et la pureté runtime de `packages/domain`.
- AGREE: Nommer `apps/pc-proof` comme application de caisse actuelle, ne pas reconstruire la coquille Electron, garder `apps/proprietaire` hors U4, et noter que `packages/sync` n'existe pas encore, est factuellement exact.
- AGREE: Étendre `docs/glossaire-fr-en.md` pour U4, et poser Zod sur l'import (colonnes + photo) et les nouveaux canaux IPC, est le bon complément à la validation déjà en place (paramètres, pont U1).
- AGREE: Les ALWAYS/NEVER du brouillon `discovered-rules.md` ne doivent pas inventer de contrainte nouvelle ; les invariants CLAUDE.md (ajout seul, hors-ligne, DEC-04, vendeur sans coûts, pas de `any`) restent.
- AGREE: L'entretien doit trancher l'anglais du domaine existant plutôt que de laisser un agent renommer `quantiteStock` / `ENTREE_ACHAT` au fil de U4.
- OBJECT: Le brouillon présente un seul type `Result` ; le dépôt a deux enveloppes (`error` vs `code`+`message`). U4 doit affirmer le mapping domaine/`db` → IPC, pas les fusionner ni les laisser ambiguës.
- OBJECT: Les règles catalogue (plancher, quantité interdite, masquage vendeur) sont aujourd'hui dans `packages/db`, et `apps/pc-proof` n'importe pas `@tenu/domain`. Sans consigne U4 « règles dans domain, `db` adaptateur », la Construction recollera du métier dans l'UI ou dupliquera `catalog/product.ts`.
- OBJECT: La clôture ESLint du domaine omet `@tenu/db` ; c'est un trou de frontière à fermer avant la première fiche, pas une simple note d'evidence.
- OBJECT: L'entretien « tout aligner / tout geler » est trop grossier. Geler les énumérations déjà persistées (rôles, kinds) ; anglais pour le code nouveau ; glossaire calé sur `internal_code` / `floor_price` / `active` ; hors périmètre U4 pour `especes` vs `cash` et `quantiteStock`.
- OBJECT: Tant que `discovered-rules` dit `apps/caisse`, les agents peuvent créer ce paquet. Le Code Style affirmé doit dire : U4 écrit dans `apps/pc-proof` uniquement, pas de scaffold `apps/caisse`.

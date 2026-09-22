# CI Pipeline — Questions

> Contexte déjà figé : hooks locaux (`.githooks/`), merge local sans PR, trunk `main`, pas de cloud. `team.md` : CI GitHub minimale due avant boutique.

## Q1. Outil CI distant

Quelle CI distante poser pour U4 (en plus des hooks locaux, qui restent) ?

- A. GitHub Actions : workflow minimal sur `push`/`pull_request` vers `main` (`pnpm install --frozen-lockfile`, typecheck, lint, test, forbidden-word, `pnpm audit --audit-level=high`) — recommandé, aligne `team.md` Q4 + infra design
- B. Reporter la CI distante : hooks locaux seuls jusqu'à J1 boutique
- X. Other (please specify)

[Answer]: X. je prefere une bonne architure pour le CI qu'on pourra utiliser si L'application devient grande

## Q2. Contenu des quality gates

Quels contrôles bloquants dans la CI (et documentés dans `quality-gates.md`) ?

- A. Miroir du `pre-push` + ENF-14 : typecheck, lint, test (seuils couverture), audit high, mot interdit ; secrets via hook pre-commit (pas rejoué en CI sans historique complet) — recommandé
- B. Strictement typecheck + lint + test (sans audit ni forbidden-word en CI)
- X. Other (please specify)

[Answer]: B

## Q3. Artefacts et packaging Electron

Que faire des artefacts de build ?

- A. Pas de registre d'artefacts (ECR/S3) : packaging Electron optionnel / non bloquant (comme infra design) ; livrable = installateur produit hors CI ou en job warning — recommandé
- B. Ajouter un job bloquant `pnpm build` Electron sur runner Linux
- X. Other (please specify)

[Answer]: B

## Consolidated Summary Confirmation

**Q1-X — architecture évolutive.** GitHub Actions scalable monorepo :
- entrée `.github/workflows/ci.yml` (`push`/`pull_request` → `main`, `feat/**`) ;
- reusable `.github/workflows/reusable-ci.yml` (`workflow_call`) avec jobs `setup` (Node 22 + pnpm cache + install figé) → `typecheck` / `lint` / `test` en parallèle → `build-electron` (`pnpm build` = `electron-vite build`) bloquant ;
- extension future sans refonte : jobs `android` / `e2e` / path filters / matrix.

**Q2-B.** Gates CI bloquants = typecheck + lint + test (seuils couverture). Audit et ENF-14 restent aux hooks locaux (écart vs `team.md` documenté).

**Q3-B.** Job `build-electron` bloquant ; artifact GitHub Actions (rétention courte) ; pas ECR/S3.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

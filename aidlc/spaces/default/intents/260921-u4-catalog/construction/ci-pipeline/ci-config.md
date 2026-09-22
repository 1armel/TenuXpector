# Configuration CI — U4 Catalogue

**Summary Authorization Id:** 53a04a8628c1e7e7fe92750f39d747021c9798d07a3a390604f632fae7860f18

## Objectif

CI distante **évolutive** (Q1-X) en GitHub Actions, en complément des hooks locaux `.githooks/` (qui restent la porte merge locale). Pas de déploiement cloud.

## Topologie (scalable)

```
.github/
  actions/setup-node-pnpm/action.yml   # composite : Node 22.20 + pnpm 10.15 + cache + install figé
  workflows/ci.yml                     # entrée : push / pull_request
  workflows/reusable-ci.yml            # workflow_call : jobs qualité + build
```

### Triggers (`ci.yml`)

- `push` et `pull_request` vers `main` et `feat/**`
- Appelle uniquement `reusable-ci.yml` (aucun job métier dans l’entrée)

### Jobs (`reusable-ci.yml`)

| Job | Needs | Commande | Bloquant |
|---|---|---|---|
| `typecheck` | — | `pnpm typecheck` | Oui (Q2-B) |
| `lint` | — | `pnpm lint` | Oui (Q2-B) |
| `test` | — | `pnpm test` | Oui (Q2-B) |
| `build-electron` | typecheck, lint, test | `pnpm build` (`electron-vite build`) | Oui (Q3-B) |

Chaque job démarre par la composite `setup-node-pnpm` (install isolée, cache store pnpm). Les jobs qualité tournent en **parallèle** ; le build attend les trois verts.

### Hors CI (volontaire, Q2-B)

| Contrôle | Où |
|---|---|
| Secrets (ENF-08) | `.githooks/pre-commit` |
| Mot interdit (ENF-14) | `.githooks/pre-commit` + `pnpm check:forbidden-word` local |
| `pnpm audit --audit-level=high` | `.githooks/pre-push` |

### Artefacts

- Upload `apps/pc-proof/out/` (et dist associés) en artifact GitHub Actions, rétention 7 jours
- Pas d’ECR / CodeArtifact / S3

### Extension future (sans refonte)

Ajouter des jobs dans `reusable-ci.yml` : `e2e`, `android`, matrix par package, path filters. La composite d’install reste le point unique de bootstrapping.

## Fichiers générés dans le dépôt

- `.github/actions/setup-node-pnpm/action.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/reusable-ci.yml`

## Runner

`ubuntu-latest`, Node `22.20.0` (engines / `.nvmrc`), pnpm via `packageManager` `pnpm@10.15.0`. Outils natifs (`build-essential`, `python3`) pour `better-sqlite3-multiple-ciphers` au job build.

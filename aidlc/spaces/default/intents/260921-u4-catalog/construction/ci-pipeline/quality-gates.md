# Quality Gates — CI U4 Catalogue

**Summary Authorization Id:** 53a04a8628c1e7e7fe92750f39d747021c9798d07a3a390604f632fae7860f18

## Gates bloquants en CI (Q2-B)

| Gate | Commande | Seuil / critère | Source |
|---|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 | Build and Test / team.md |
| Lint | `pnpm lint` | exit 0 | Build and Test / team.md |
| Tests + couverture | `pnpm test` | exit 0 ; domain ≥ 90 % L/B ; db & pc-proof ≥ 80 % | Testing Contract / ENF-11 |
| Build Electron | `pnpm build` | exit 0 (`electron-vite build`) | Q3-B |

Échec de n’importe lequel → workflow rouge ; pas de merge / push considéré sain.

## Gates hors CI (hooks locaux)

| Gate | Hook | Commande |
|---|---|---|
| Secrets | pre-commit | `node scripts/check-staged-secrets.mjs` |
| Mot interdit ENF-14 | pre-commit | `node scripts/check-forbidden-word.mjs --staged` |
| Audit deps | pre-push | `pnpm audit --audit-level=high` |
| Typecheck / lint / test | pre-push | mêmes commandes que CI |

## Non-bloquants / différés

| Cible | Statut | Propriétaire |
|---|---|---|
| ENF-02 recherche p95 | Unverified | `performance-validation` |
| ENF-16 50 fiches / 15 min | Unverified | `performance-validation` |
| Playwright catalogue | J1 | practices / team.md |
| FR3.3–FR3.8 | Bolts C2–C4 | delivery-planning |

## Alignement Build and Test

Les commandes CI `typecheck` / `lint` / `test` sont **identiques** à celles exécutées et Met dans `construction/build-and-test/test-results.md`. Le build Electron est un gate **ajouté** par Q3-B (non mesuré dans Build and Test C1 — à valider au premier run Actions).

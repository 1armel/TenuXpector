# Pipeline CI/CD — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Q2-A : étendre la CI monorepo existante ; pas de déploiement cloud.

## Stratégie

- **Trunk-based** : branches courtes → squash-merge `main` (org.md).
- **Cible U4** : artefact = app Electron `pc-proof` installable sur PC ; pas de promote staging/prod cloud.
- **Rollback** : revert git / réinstall build précédent ; migrations DB **réversibles**.

## Stages → gates

| Stage | Actions | Gate |
|---|---|---|
| Install | `pnpm install` (lockfile) | Fail bloquant |
| Typecheck | `pnpm typecheck` | Fail bloquant |
| Lint | `pnpm lint` | Fail bloquant |
| Unit / domain | `pnpm test` — incl. nouveaux tests `packages/domain` catalogue (BR3.x) | Fail bloquant |
| Secrets | Scan secrets (ENF-08 / NFR20) | Fail bloquant |
| Forbidden word | Garde « quincaillerie » (ENF-14) | Fail bloquant |
| Package (opt.) | Build Electron `pc-proof` sur runner desktop-capable | Warning si skip runner |

## Secrets in CI

| Secret | Storage | U4 need |
|---|---|---|
| Aucune clé OCR cloud | — | CR-02 : pas de vendor tant que spécimen absent |
| Clés signing Electron (si déjà) | Secret store CI existant | Réutiliser ; ne pas ajouter de secrets catalogue |

## Déploiement boutique

1. Build local ou CI → artefact installateur.
2. Install manuelle sur PC caisse (hors AWS).
3. Migration SQLite au démarrage (réversible).
4. Seed démo / import fichier pour J1.

## Hors scope pipeline U4

- Deploy AWS / VPS.
- Canary / blue-green cloud.
- Dashboards Datadog/CloudWatch.

# Journal de déploiement — U4 Catalogue (proxy ENV-DEV)

**Summary Authorization Id:** 587fea7070514668621a7ec9876fb2bb87e09ddcd3ed4ea4fa9d541bca9340e2  
**Date (UTC):** 2026-09-22T22:50:44Z  
**Git SHA (short):** `bf81dde`  
**Mode:** Q1-A proxy — **aucune** install PC boutique

## Fenêtre

| Champ | Valeur |
|---|---|
| Cible | ENV-DEV (machine développeur) |
| Fenêtre | Immédiat / hors production |
| Approbateur install boutique | N/A (non tentée) |

## Pré-checks

| Check | Résultat |
|---|---|
| Phase-check Construction→Operation | HOLD (inchangé) |
| ENV-BOUTIQUE provisionné | Non |
| CI / hooks design | Présents (`.github/`, `.githooks/`) |
| Migrations boutique | Non appliquées (pas d’install) |

## Exécution

| Étape | Commande / action | Exit |
|---|---|---|
| Build Electron | `pnpm build` (`electron-vite build`) | 0 |
| Sortie | `apps/pc-proof/out/main/main.cjs`, preload, renderer | OK |
| Transfert USB / install caisse | Non exécuté | — |
| Migration SQLite prod | Non exécutée | — |

## Verdict déploiement

**PROXY SUCCESS** sur ENV-DEV.  
**BOUTIQUE:** non déployé (HOLD + Q1-A).

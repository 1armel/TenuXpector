# Inventaire des environnements — U4 Catalogue

**Summary Authorization Id:** 6fddb00b40d7e454b8570a2ddb4812b63f38f9cd1cc82fdf0d0bdab1a3fda980

## Périmètre (Q1-A)

Aucun environnement AWS. Inventaire = postes locaux alignés sur `infrastructure-specification.md` et `cd-config.md`.

## ENV-DEV — Machine développeur

| Attribut | Valeur attendue / constat |
|---|---|
| Rôle | Build, tests, hooks, CI push |
| OS | Linux (constat session : Manjaro) |
| Runtime | Node `>=22.20.0` (`.nvmrc` 22.20.0) ; pnpm `10.15.0` |
| Hooks | `.githooks/` via `pnpm prepare` (`pre-commit`, `pre-push` exécutables) |
| Artefacts locaux | `pnpm typecheck` / `lint` / `test` / `build` |
| CI distante | GitHub Actions `ci.yml` → `reusable-ci.yml` |
| Cloud | Aucun compte requis |

**Statut provisioning :** prêt pour continuum C1 (outil local vérifié dans le flux Build and Test / CI).

## ENV-BOUTIQUE — PC caisse (prod locale)

| Attribut | Valeur attendue |
|---|---|
| Rôle | Runtime Electron `pc-proof` + SQLite chiffrée |
| Réseau métier | Hors ligne pour le métier (IPC local) |
| Stockage | Fichier DB SQLCipher (`packages/db`) |
| Périphériques | Imprimante ESC/POS USB (étiquettes / tickets) |
| Authz | Rôles shell caisse (RoleGate catalogue) |
| Déploiement | Install manuelle (voir `deployment-strategy.md`) |
| Cloud | Aucun |

**Statut provisioning :** **non installé pour U4 complet** — phase-check Construction→Operation = HOLD (C2–C4, ENF-02/16, R-01/R-02). Checklist prête pour quand le HOLD sera levé.

## ENV-STAGING

Non retenu (Q2 Deployment Pipeline). Absent de l’inventaire.

## Secrets & paramètres (Q2-A)

| Élément | Emplacement | Dans git ? |
|---|---|---|
| Clé SQLCipher / secrets runtime | Hors dépôt (fichier/env local) | Non |
| Paramètres métier | Table `parametres` | Non (données) |
| Signing Electron (si existant) | Secrets GitHub Actions | N/A dépôt |
| OCR vendor | Non branché (CR-02) | — |

## Ressources cloud

| Ressource | Statut |
|---|---|
| VPC / subnets / SG | N/A — CT-07 |
| Secrets Manager / SSM | N/A |
| Comptes AWS | N/A |

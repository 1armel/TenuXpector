# Deployment Pipeline — Questions

> Contexte figé : pas de cloud (CT-07) ; artefact = installateur / build Electron `pc-proof` ; DB SQLite locale ; hooks + CI qualité séparés. Phase check Construction→Operation : HOLD (C2–C4 restants).

## Q1. Stratégie de déploiement boutique

Comment livrer U4 / la caisse sur le PC boutique ?

- A. Install manuelle : build CI ou local → copie installateur / dossier `out` sur clé USB ou partage local → install sur PC caisse ; pas de blue/green ni canary cloud — recommandé (aligne infra)
- B. Pipeline CD GitHub Actions qui pousse automatiquement vers un serveur / partage réseau boutique
- X. Other (please specify)

[Answer]: A

## Q2. Environnements et portes

Quels environnements et portes d’approbation ?

- A. Deux niveaux seulement : machine développeur (dev) → PC boutique (prod locale) ; porte humaine explicite avant chaque install boutique (pas de staging cloud) — recommandé
- B. Ajouter un PC « staging » physique en boutique avant la caisse de production
- X. Other (please specify)

[Answer]: A

## Q3. Rollback

Procédure de rollback principale ?

- A. Garder le build précédent + dump/backup SQLite avant migration ; rollback = réinstall build N-1 + migration inverse si besoin (réversible) — recommandé
- B. Rollback via feature flags distants (AppConfig / Evidently)
- X. Other (please specify)

[Answer]: A

## Q4. Feature flags

Stratégie de feature flags pour U4 ?

- A. Aucun flag distant : activation par version installée + paramètres locaux `parametres` déjà en base — recommandé (offline)
- B. Introduire un service de flags cloud
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

**Q1-A.** CD = install manuelle Electron (CI ou local → USB/partage → PC caisse). Pas de blue/green / canary cloud.

**Q2-A.** Environnements : dev → PC boutique ; porte humaine avant chaque install prod locale. Pas de staging cloud.

**Q3-A.** Rollback : conserver build N-1 + backup SQLite avant migration ; réinstall N-1 + migration inverse si besoin.

**Q4-A.** Pas de feature flags distants ; version installée + table `parametres` locale.

Artefacts à produire : `cd-config.md`, `deployment-strategy.md`, `rollback-runbook.md`.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

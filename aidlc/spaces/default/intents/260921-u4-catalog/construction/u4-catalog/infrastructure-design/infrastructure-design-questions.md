# Conception infrastructure — Questions (`u4-catalog`)

**Construction.** Kind `ui`, caisse Electron locale. Artefacts dus : `infrastructure-specification.md`, `monitoring-design.md`, `cicd-pipeline.md`, `traceability.json`. Pas de compte AWS (CT-07). Option A = recommandation.

## Q1. Quoi provisionner pour U4 ?

A. **Rien de cloud** : étendre `apps/pc-proof` + `packages/db` (index recherche, tables catalogue déjà là) + adaptateur OCR on-device ; packaging Electron inchangé en principe ; migrations SQLite réversibles seulement
B. Ajouter un service OCR hébergé (contredit CR-02 tant que pas de spécimen)
C. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. CI / surveillance U4 ?

A. Étendre la CI existante : typecheck/lint/test monorepo + tests domain catalogue + garde secrets ; monitoring = logs locaux structurés côté main (pas de stack observabilité cloud en U4)
B. Pipeline déploy cloud + dashboards Datadog/CloudWatch
C. Pas encore défini
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Infra : **local only** — `pc-proof` + `packages/db` + OCR on-device ; migrations réversibles ; pas de cloud (CT-07 / CR-02)
- CI / monitoring : CI monorepo existante + tests domain catalogue + garde secrets ; logs locaux main

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

# Conception NFR — Questions (`u4-catalog`)

**Construction.** Kind `ui`. Artefacts dus : `performance-design.md`, `security-design.md`, `logical-components.md`, `traceability.json` (pas de scalability / reliability / observability — réservés aux `service`). `nfr-requirements` a été **sauté** : on part des ENF / CT du document d’exigences + spec fonctionnelle. Option A = recommandation.

## Q1. Budgets de performance catalogue à figer dans le design ?

A. **ENF-02** : recherche catalogue p95 < 200 ms sur 10 000 articles (PC Electron) ; **ENF-16** : 50 créations minimales < 15 min ; debounce recherche local ; index SQLite sur champs de recherche ; pas de CDN / cache réseau
B. Budgets plus souples (p95 < 500 ms) pour accélérer C1
C. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Périmètre sécurité U4 (design) ?

A. Réutiliser le socle : base locale chiffrée (ENF-08), Zod IPC, SensitiveDataGuard / BR3.17, audit+outbox atomiques ; **CR-02** OCR sur appareil par défaut ; aucun secret dans le dépôt ; vendeur sans coûts
B. Ajouter un modèle d’auth catalogue distinct de la session caisse
C. Pas encore défini
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Perf : **ENF-02** p95 < 200 ms (10k) + **ENF-16** 50 créations / 15 min ; index SQLite local
- Sécu : socle chiffré + Zod IPC + masquage BR3.17 + CR-02 OCR on-device ; pas d’auth catalogue séparée

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

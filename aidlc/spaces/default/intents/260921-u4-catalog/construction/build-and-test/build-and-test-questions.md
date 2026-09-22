# Build and Test — Questions

## Consolidated Summary Confirmation

**Périmètre.** Build and Test stage-level pour l'unité `u4-catalog` (Bolt C1 Catalogue déjà généré). Socle u1–u3 inchangé.

**Artefacts à produire.** `build-instructions.md`, `integration-test-instructions.md`, `performance-test-instructions.md`, `security-test-instructions.md`, `build-and-test-summary.md` (matrice de cibles), `test-results.md`, `cross-unit-traceability.md`.

**Commandes à exécuter.** `pnpm typecheck && pnpm lint && pnpm test` ; commandes unit-scopées catalogue de `unit-test-instructions.md` ; `pnpm check:forbidden-word` (ENF-14). Playwright catalogue / ENF-02 perf recherche / ENF-16 chronométrage : différés à J1 (`performance-validation` / opérateur), notés Unverified avec stage propriétaire.

**Succès.** Toutes les commandes exécutées vertes ; domain ≥ 90 % lignes/branches ; db et pc-proof ≥ 80 % ; seuils jamais abaissés. Findings C1 revue (R-01 LIKE, R-02 ADR) : suivi documenté, non bloquant pour cette porte si la suite reste verte.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct 

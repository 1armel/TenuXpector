# Spécification infrastructure — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Q1-A : rien de cloud (CT-07). Extends brownfield `apps/pc-proof` + `packages/db`.

## Deployment

| Facet | Choice | Rationale |
|---|---|---|
| Compute model | Desktop Electron (`apps/pc-proof`) on PC boutique | U4 embarqué dans la caisse déjà livrée (CT-01) |
| Networking | IPC local main↔renderer ; pas d’ingress cloud | Métier hors ligne ; OCR on-device (CR-02) |
| Storage | SQLite chiffrée (SQLCipher) via `packages/db` | Socle existant ; migrations réversibles seulement |
| Environments | Dev machine développeur → build installable PC ; pas de staging cloud U4 | Pas de compte AWS |
| IaC | Aucun (pas de CDK/Terraform pour U4) | CT-07 |
| Resource sizing | 1 processus Electron + 1 fichier DB local ; index recherche sur 10k articles | NFR3.1 / ENF-02 |

## Infrastructure Services

| Service | Role | Configuration | Notes |
|---|---|---|---|
| LocalEncryptedSqlite | database | SQLCipher ; tables `products`, `selling_units`, `categories` ; index recherche normalisée | Migration additive + ADR si breaking |
| CatalogSearchIndex | search (in-DB) | Index sur designation / synonymes / internal_code / barcode (formes normalisées) | Pas de moteur externe |
| TextRecognitionPort | other (OCR) | Implémentation on-device par défaut ; C-04 non branché | Figé en fin U4 (FR3.6) |
| UsbEscPosPrinter | other | Adaptateur impression existant | Étiquettes article |
| ElectronRuntime | other | Shell `pc-proof` | Packaging inchangé en principe |

## Shared Infrastructure

| Shared Resource | Owner Unit | Consumer Units | Access Boundary |
|---|---|---|---|
| SQLite locale chiffrée | packages/db (fondation) | u4-catalog + caisse u3 | `tenant_id` ; pas de DELETE articles |
| Session / rôle opérateur | shell caisse | CatalogUi RoleGate | Source unique authz |
| Imprimante ESC/POS | adaptateur existant | étiquettes U4 + tickets | Timeout `PRINTER_UNAVAILABLE` |

# Résumé des contrats — U4 Catalogue

Entrées : Q1–Q3 = A ; `unit-of-work.md` ; `components.md` ; IPC existant (`apps/pc-proof/src/shared/ipc-contract.ts`) ; schéma `packages/db` (tables `products`, `selling_units`, `categories`).

Pas d’API HTTP publique dans U4. Les frontières sont : **IPC Electron**, **schéma SQL partagé**, **adaptateur OCR**.

## Tableau des contrats

| # | Provider | Consumer | Mechanism | Owner |
|---|---|---|---|---|
| C-01 | u4-catalog (main / domain+db) | CatalogUi (renderer) | IPC Electron + Zod | u4-catalog |
| C-02 | packages/db (schéma catalogue) | u4-catalog + caisse déjà livrée | Shared SQLite schema | packages/db (migrations) |
| C-03 | TextRecognition adapter | CatalogCapture | Interface TypeScript interne | u4-catalog |
| C-04 | External: OCR vendor (futur) | CatalogCapture | HTTPS (si un jour retenu) | u4-catalog — **non branché** tant que CR-02 |

## C-01 — IPC catalogue

Canaux à ajouter au pont existant (même discipline : Zod strict, `Result` / `Failure`, taille max, double validation). Noms provisoires anglais.

```yaml
# shared-schema: ipc-catalog (Zod conceptual)
contract: ipc-catalog
version: 1
transport: electron-ipc
max_payload_bytes: 65536
channels:
  - name: catalog.search
    request:
      query: string
      limit: int
    response:
      items: ProductSummary[]   # no purchase cost / CUMP / margin for vendeur
  - name: catalog.getProduct
    request:
      productId: uuid
    response:
      product: ProductView      # SensitiveDataGuard applied by role
  - name: catalog.saveProduct
    request:
      mode: create|update|duplicate
      fields: ProductWrite      # min 4 fields on create
    response:
      productId: uuid
      internalCode: string
  - name: catalog.deactivate
    request:
      productId: uuid
    response:
      ok: true
  - name: catalog.printLabel
    request:
      productId: uuid
      target: preview|usb|spooler
    response:
      printed: bool
      via: string
  - name: catalog.importPreview
    request:
      sourcePath: string
      columnMapping: object
    response:
      batchId: uuid
      rows: PreviewRow[]        # status: ok|warn|error|duplicate
  - name: catalog.importCommit
    request:
      batchId: uuid
    response:
      created: int
      updated: int
      errorsPath: string|null
  - name: catalog.capturePreview
    request:
      imagePath: string
    response:
      batchId: uuid
      lines: ExtractedLine[]    # designation + sale price only
  - name: catalog.captureCommit
    request:
      batchId: uuid
      acceptedLineIds: uuid[]
    response:
      created: int
errors:
  - INVALID_REQUEST
  - INVALID_RESPONSE
  - FORBIDDEN_ROLE
  - VALIDATION_FAILED
  - DATABASE_FAILED
  - PRINTER_UNAVAILABLE
  - OCR_UNAVAILABLE
  - INTERNAL_ERROR
timeouts:
  search_ms: 2000
  save_ms: 5000
  import_commit_ms: 60000
  capture_preview_ms: 120000
retry: none   # local IPC; caller may re-invoke idempotent search/get
unknown_fields: ignore_on_read
```

## C-02 — Schéma SQL catalogue (partagé)

```yaml
# shared-schema: catalog-tables
contract: catalog-sqlite
version: schema-v2-plus   # extends existing foundation migration
owner: packages/db
tables:
  products:
    keys: [id]
    unique: [[tenant_id, internal_code]]
    notes: >
      average_purchase_cost never exposed to vendeur via IPC.
      active 0|1; never DELETE.
      floor_price <= reference_price (CHECK).
      Quantities are NOT written by catalog import/capture.
  selling_units:
    keys: [id]
    refs: [product_id -> products.id]
  categories:
    keys: [id]
    refs: [parent_id -> categories.id]
    notes: U4 may seed only; creation rules deferred if unused in UI
breaking_change_policy: reversible migration + ADR
additive_columns: allowed; readers ignore unknown
```

## C-03 — Adaptateur TextRecognition (interne)

```yaml
# shared-schema: text-recognition-port
contract: text-recognition-port
version: 1
owner: u4-catalog
interface: TextRecognitionPort
methods:
  - name: extractSaleLines
    input:
      imagePath: string   # file already on disk; never camera stream
    output:
      lines:
        - designation: string
          salePrice: int    # FCFA integers
    errors: [UNSUPPORTED_FORMAT, EXTRACTION_FAILED, UNAVAILABLE]
constraints:
  - NEVER send average_purchase_cost / purchase price
  - NEVER call network from renderer
  - Default implementation: on-device (CR-02)
```

## C-04 — OCR tiers (externe, non branché)

```yaml
# OpenAPI stub — NOT wired while CR-02 holds
openapi: 3.0.3
info:
  title: Future OCR vendor (placeholder)
  version: 0.0.0-unwired
paths: {}
x-tenu-policy: >
  Do not configure base URL or API keys until a paper-register specimen
  has been reviewed. If enabled later: send designation/sale-price crops
  only; never purchase price; never whole register image with cost columns.
```

## Règles de propriété

| Contrat | Owner | Breaking change | Additive |
|---|---|---|---|
| C-01 IPC | u4-catalog | Nouveau numéro de version canal + tests des deux côtés du pont | Champs optionnels ; lecteur ignore l’inconnu |
| C-02 SQL | packages/db | Migration réversible + ADR | Colonnes nullables / tables annexes |
| C-03 Port OCR | u4-catalog | Nouvelle interface ou version de port + ADR adaptateur | Nouveaux codes d’erreur documentés |
| C-04 Vendor | u4-catalog | Interdit tant que CR-02 ; ensuite ADR + hash dépendance | — |

## Questions ouvertes

| Contract | Question | Blocks |
|---|---|---|
| C-01 | Liste exacte des canaux IPC vs regroupement `catalog.command` | Bolt C1 (noms de canaux) |
| C-02 | Création UI des catégories ou seed seul | Functional design Category |
| C-03 | Bibliothèque on-device retenue à la PoC | Bolt C4 / ADR OCR |
| C-04 | Fournisseur éventuel après spécimen | Hors chemin J1 |

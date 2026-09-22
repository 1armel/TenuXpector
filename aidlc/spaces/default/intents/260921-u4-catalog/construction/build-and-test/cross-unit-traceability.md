# Cross-Unit Traceability — U4 Catalogue intent

**Verdict:** PASS for C1 scope (FR3.1, FR3.2, BR3.x C1, CT-09, NFR3.1 schema, ENF-08/11, DEC-04). FR3.3–FR3.8 await Bolts C2–C4.

## Method

Matched `construction/u4-catalog/code-generation/traceability.json` against functional-spec / NFR design IDs for C1.

## Coverage table (C1)

| ID | Status | Target (from CG) |
|---|---|---|
| FR3.1 | OK | ArticleForm, product-create, catalog-ipc |
| FR3.2 | OK | CatalogSearch, normalize, catalog-service |
| BR3.1 | OK | internal-code |
| BR3.2 | OK | product-create (floor) |
| BR3.3 | OK | base selling unit |
| BR3.4 | OK | normalize / search |
| BR3.9 | OK | minimal create |
| BR3.17 / CT-09 | OK | seller-projection, RoleGate |
| NFR3.1 | OK | migrations search_normalized (LIKE caveat R-01) |
| ENF-08 | OK | catalog-service outbox |
| ENF-11 | OK | domain catalog tests + suite |
| DEC-04 | OK | integer money validation |

## Later Bolts (not C1)

| ID | Status | Bolt |
|---|---|---|
| FR3.3–FR3.5 | Uncovered | C2 |
| FR3.6–FR3.7 | Uncovered | C3 |
| FR3.8 | Uncovered | C4 |

## Findings for approval gate

1. C1 executable gates Met.  
2. ENF-02 / ENF-16 Unverified → `performance-validation`.  
3. Open CG findings R-01 / R-02 before J1.  

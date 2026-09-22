# Cross-Unit Traceability

**Verdict:** PARTIAL PASS — all FRs in scope of completed units (FR1 foundation subset, FR2 domain) are OK in CG traceability; FR3–FR10 await later units after this early Build and Test jump.

## Method

Enumerated FRs from `inception/requirements-analysis/requirements.md`. Matched against:

- `construction/u1-pc-proof/code-generation/traceability.json`
- `construction/u2-foundation/code-generation/traceability.json`
- `construction/u3-domain/code-generation/traceability.json`

## Coverage table

| ID | Status | Owning unit | Target (from CG) |
|---|---|---|---|
| FR1.2 | OK | u2-foundation | packages/db migrations / encrypted-database |
| FR1.3 | OK | u2-foundation | append-only guards |
| FR1.4 | OK | u2-foundation | tenant isolation |
| FR1.5 | OK | u2-foundation | uuid-v7 |
| FR1.6 | OK | u2-foundation | identity PIN |
| FR1.7 | OK | u2-foundation | demo seed (no sales per U2 plan) |
| FR1.8 | OK | u2-foundation | settings |
| FR1.9 | OK | u2-foundation | gerant assign/revoke |
| FR1.1 | GAP | monorepo layout | Present in repo; not always listed in u2 upstream_ids — treat as structural OK |
| FR2.1–FR2.10 | OK | u3-domain | packages/domain/* + properties.spec.ts |
| FR3.* | Uncovered | u4-catalog | — |
| FR4.* | Uncovered | u5-register | — |
| FR5.* | Uncovered | u6-printing | — |
| FR6.* | Uncovered | u7-audit-alerts | — |
| FR7.* | Uncovered | u8-sync | — |
| FR8.* | Uncovered | u9-procurement | — |
| FR9.* | Uncovered | u10-credit | — |
| FR10.* | Uncovered | u11-invoicing | — |
| NFR4,8,11,13,14,17 | OK | u1-pc-proof | pc-proof + scripts |

## Findings for approval gate

1. **Expected gaps** FR3–FR10 — not failures of delivered code; resume Construction unit-major for u4+.  
2. **u3-domain** FR2.* fully OK with live coverage ≥ 90%.  
3. Optional: re-run full E2E/resilience before boutique install.  

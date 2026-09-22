# Integration Test Instructions

Strategy: Comprehensive. Cross-unit boundaries for units with Code Generation (u1, u2, u3).

## Boundaries in scope

| Boundary | How covered |
|---|---|
| Electron ↔ encrypted DB (u1) | `apps/pc-proof` Vitest + Playwright E2E |
| Identity / Settings / TransactionalWriter / append-only (u2) | `packages/db` Vitest |
| Pure domain calculations (u3) | `packages/domain` Vitest + fast-check properties |
| domain ↔ db | **Not yet wired** in app code — domain is pure; callers in later units. No integration test until U5/U7 consume domain |

## Commands (deduplicated)

```bash
pnpm test:unit
pnpm test:db
pnpm test:domain
```

Or once:

```bash
pnpm test
```

## Expected

- All suites green  
- `packages/domain` ≥ 90 % lines and branches  
- `packages/db` and `apps/pc-proof` ≥ 80 % where configured  

## Out of scope this pass

- Full caisse E2E (ouverture → vente → clôture) — needs u5-register UI  
- Sync / API dashboard ACL — later units  

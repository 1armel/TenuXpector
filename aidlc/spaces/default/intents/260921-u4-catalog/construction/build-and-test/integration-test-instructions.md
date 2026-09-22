# Integration Test Instructions — U4 Catalogue (C1)

Strategy: Comprehensive. Cross-unit boundaries for u1–u3 (socle) + u4-catalog C1.

## Boundaries in scope

| Boundary | How covered |
|---|---|
| Electron ↔ encrypted DB (u1) | `apps/pc-proof` Vitest |
| Identity / Settings / TransactionalWriter / outbox (u2) | `packages/db` Vitest |
| Pure domain (u3 + catalog rules) | `packages/domain` Vitest |
| Catalog domain → db → IPC → UI (u4 C1) | `catalog-service.spec.ts` + `catalog.spec.tsx` + handlers |

## Commands (deduplicated)

```bash
pnpm test
```

Or separately:

```bash
pnpm test:unit
pnpm test:db
pnpm test:domain
```

Catalogue-focused (optional extra pass):

```bash
pnpm exec vitest run packages/domain/tests/catalog.spec.ts
pnpm exec vitest run packages/db/tests/catalog-service.spec.ts
pnpm exec vitest run apps/pc-proof/tests/catalog.spec.tsx
```

## Expected

- All suites green  
- `packages/domain` ≥ 90 % lines and branches  
- `packages/db` and `apps/pc-proof` ≥ 80 %  

## Out of scope this pass

- Full caisse E2E (ouverture → vente → clôture) — debt u3 / later  
- Playwright parcours catalogue « créer / retrouver / masquer » — J1  
- Sync / API dashboard ACL — later units  

# Security Test Instructions — U4 Catalogue (C1)

## Local checks (executable)

```bash
# ENF-14 — mot interdit hors seed
pnpm check:forbidden-word

# Typed lint (no-explicit-any / unsafe-*)
pnpm lint

# Secrets on staged files (pre-commit hook)
# Triggered by git commit via .githooks/pre-commit
```

## Catalogue-specific (covered by unit tests)

| Check | Evidence |
|---|---|
| Vendeur without cost fields (BR3.17 / CT-09) | `catalog.spec.ts` projection + `catalog.spec.tsx` RoleGate |
| FORBIDDEN_ROLE on save as vendeur | `probe-application` / catalog IPC tests |
| Zod reject on IPC | `catalog-ipc` / bridge tests |
| tenant_id on catalog queries | `catalog-service.spec.ts` |
| Outbox + audit same transaction (ENF-08) | `catalog-service.spec.ts` |

## Deferred

| Check | Owning stage |
|---|---|
| `pnpm audit --audit-level=high` in CI | `ci-pipeline` (hook pre-push already runs it locally) |
| Path traversal on import/photo paths | C3+ when those channels land |

## Expected

- `pnpm check:forbidden-word` and `pnpm lint` exit 0  
- Seller cost assertions never see purchase price / CUMP / margin  

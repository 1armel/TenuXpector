# Security Test Instructions

## Checks executable now

| Control | Command | Maps to |
|---|---|---|
| Forbidden word (ENF-14) | `pnpm check:forbidden-word` | Code under `apps/`, `packages/`, root config |
| Secrets on staged files (ENF-08) | `pnpm check:secrets` | Pre-commit path; run on staged set when committing |
| Domain purity (BR9.1) | ESLint in `pnpm lint` | No DB/UI/network imports from `packages/domain` |
| PIN / encryption | Covered by `packages/db` unit tests | PBKDF2, encrypted DB (u1/u2) |

## Commands

```bash
pnpm check:forbidden-word
pnpm lint
pnpm test:db
pnpm test:domain
```

## Deferred / later

| Item | Reason |
|---|---|
| TLS / token revocation | Needs sync server (u8) |
| DAST / full SAST CI job | CI GitHub minimal not yet mandatory before boutique install |
| Dashboard ACL API tests | Owner app / API unit |

## Pass criteria this stage

- `pnpm check:forbidden-word` exits 0  
- `pnpm lint` exits 0  
- No secrets committed in this pass’s changed tracked files (manual/hook)  

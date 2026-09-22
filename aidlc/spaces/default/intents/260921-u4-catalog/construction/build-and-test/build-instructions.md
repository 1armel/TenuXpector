# Build Instructions — TenuXpector · U4 Catalogue (C1)

## Prerequisites

- Node.js ≥ 22.20.0
- pnpm 10.15.0 (`packageManager` field)
- Dependencies: `pnpm install` (lockfile committed; prefer `--frozen-lockfile` in CI)

## Commands

```bash
# Typecheck (all packages)
pnpm typecheck

# Lint
pnpm lint

# Full unit suite (pc-proof + db + domain) with coverage floors
pnpm test

# Domain only (≥ 90 % lines + branches)
pnpm test:domain

# Forbidden-word control (ENF-14)
pnpm check:forbidden-word

# Optional: Electron E2E / power-cut (not required for C1 merge gate)
pnpm test:e2e
pnpm test:resilience
```

## Catalogue-scoped (TDD cycle)

See `construction/u4-catalog/code-generation/unit-test-instructions.md`.

## Build (installable)

```bash
pnpm build   # Electron pc-proof
```

## Verification

1. `pnpm typecheck` exits 0  
2. `pnpm lint` exits 0  
3. `pnpm test` exits 0 with coverage thresholds held (domain 90 %, others 80 %)  
4. `pnpm check:forbidden-word` exits 0  
5. Never lower a coverage threshold to pass  

## Troubleshooting

| Symptom | Action |
|---|---|
| Coverage fails on domain | Run `pnpm test:domain`; do not change thresholds |
| Forbidden-word fails | Fix code under `apps/` / `packages/` (seed path excluded) |
| Catalog specs missing from `test:domain` | Specs live under `packages/domain/tests/`, not `src/` |

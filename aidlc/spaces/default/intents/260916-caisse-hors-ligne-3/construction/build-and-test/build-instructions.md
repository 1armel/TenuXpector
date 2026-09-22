# Build Instructions — TenuXpector Construction

## Prerequisites

- Node.js ≥ 22.20.0
- pnpm 10.15.0 (`packageManager` field)
- Dependencies installed: `pnpm install` (lockfile committed; prefer frozen in CI)

## Commands

```bash
# Typecheck (all packages)
pnpm typecheck

# Lint
pnpm lint

# Full unit suite (pc-proof + db + domain)
pnpm test

# Domain only (90 % lines + branches)
pnpm test:domain

# Optional: Electron E2E (u1)
pnpm test:e2e

# Optional: power-cut resilience (long)
pnpm test:resilience

# Forbidden-word control (ENF-14)
pnpm check:forbidden-word
```

## Build (installable)

```bash
pnpm build   # @tenu/pc-proof Electron build
```

## Verification

1. `pnpm typecheck` exits 0  
2. `pnpm lint` exits 0  
3. `pnpm test` exits 0 with coverage thresholds held (domain 90 %, others 80 %)  
4. Never lower a coverage threshold to pass  

## Troubleshooting

| Symptom | Action |
|---|---|
| npm registry unreachable for fast-check | Use vendored `file:vendor/fast-check-*.tgz` and `file:vendor/pure-rand-*.tgz` already in `package.json` |
| Coverage fails on domain | Run `pnpm test:domain`; do not change thresholds |
| Forbidden-word fails | Fix code under `apps/` / `packages/` (seed path excluded) |

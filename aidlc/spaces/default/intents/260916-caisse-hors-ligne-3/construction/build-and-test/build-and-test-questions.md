# Build and Test — Questions

## Consolidated Summary Confirmation

**Scope.** Stage-level Build and Test for units with Code Generation complete: `u1-pc-proof`, `u2-foundation`, `u3-domain` (focus domain).

**Artifacts to produce.** `build-instructions.md`, `integration-test-instructions.md`, `performance-test-instructions.md`, `security-test-instructions.md`, `build-and-test-summary.md` (target matrix), `test-results.md`, `cross-unit-traceability.md`.

**Commands to execute.** `pnpm typecheck && pnpm lint && pnpm test` ; `pnpm test:domain` (90 % lines/branches) ; `pnpm check:forbidden-word`. E2E/resilience deferred as heavy/optional for this pass unless already green. No NFR design artifacts present — performance ENF owned later as Unverified/deferred with owning stage noted.

**Success.** All executed commands green; domain coverage ≥ 90 %; thresholds never lowered.

[Answer]: Looks correct

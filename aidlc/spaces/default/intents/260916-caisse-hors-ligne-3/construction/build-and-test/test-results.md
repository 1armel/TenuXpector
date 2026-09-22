# Test Results — Build and Test

**Timestamp:** 2026-09-21T10:49:04Z  
**Focus:** u1-pc-proof, u2-foundation, u3-domain (early gate after jump)

## Build

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | Not run this pass (optional installable; typecheck covers compile) |

## Unit / integration suites

| Command | Tests | Coverage (lines / branches) | Result |
|---|---|---|---|
| `pnpm test:unit` (pc-proof) | 76 passed | 91.73% / 80.61% | PASS |
| `pnpm test:db` | 57 passed | 92.71% / 80.19% | PASS |
| `pnpm test:domain` | 74 passed | **98.24% / 94.76%** (≥ 90%) | PASS |
| `pnpm test` (aggregate) | 207 passed | — | PASS |

## Security

| Command | Result |
|---|---|
| `pnpm check:forbidden-word` | PASS — 101 files, no occurrence |

## Deferred this pass

| Item | Reason |
|---|---|
| `pnpm test:e2e` | Optional heavy; u1 E2E not required to Met domain/coverage targets |
| `pnpm test:resilience` | Long power-cut bank; available as `pnpm test:resilience` |
| ENF-01 performance timings | No caisse UI yet; no `performance-validation` stage in this Operation-skipped flow |

## Target Verification Matrix (final)

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| TC-DOMAIN-90 | Testing Contract / ENF-11 | ≥ 90% lines & branches | 98.24% / 94.76% | `pnpm test:domain` | build-and-test | Met |
| TC-PKG-80 | Testing Contract | ≥ 80% other packages | db 92.7%/80.2%; pc-proof 91.7%/80.6% | `pnpm test:db`, `pnpm test:unit` | build-and-test | Met |
| BUILD-TYPECHECK | team.md porte | exit 0 | exit 0 | `pnpm typecheck` | build-and-test | Met |
| BUILD-LINT | team.md porte | exit 0 | exit 0 | `pnpm lint` | build-and-test | Met |
| BUILD-TEST | team.md porte | exit 0 | exit 0 | `pnpm test` | build-and-test | Met |
| ENF-14 | security instructions | no forbidden word | OK 101 files | `pnpm check:forbidden-word` | build-and-test | Met |
| NFR-PERF-LOCAL | performance instructions | — | No NFR Construction artifacts; caisse E2E absent | performance-test-instructions.md | N/A inventory | N/A |

## Loop-Back Log

_(empty — no failure ladder fired)_

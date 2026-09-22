# Build and Test Summary

## Overall status

**Build:** success  
**Executable quality gates:** success (typecheck, lint, test, ENF-14)  
**Cross-unit FR coverage:** partial — only u1–u3 have Code Generation (early jump)

## Test type inventory

| Type | Generated | Executed |
|---|---|---|
| Unit (per CG units) | Yes (via unit instructions) | Yes — 207 tests |
| Integration / cross-package | `integration-test-instructions.md` | Via `pnpm test` |
| Performance | `performance-test-instructions.md` | N/A this pass |
| Security | `security-test-instructions.md` | Yes — forbidden-word + lint |

## Coverage expectations

| Unit | Expected | Actual |
|---|---|---|
| u3-domain | ≥ 90% L/B | 98.24% / 94.76% |
| u2-foundation (db) | ≥ 80% | 92.71% / 80.19% |
| u1-pc-proof | ≥ 80% | 91.73% / 80.61% |

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| TC-DOMAIN-90 | Testing Contract | ≥ 90% domain | 98.24% / 94.76% | test-results.md | build-and-test | Met |
| TC-PKG-80 | Testing Contract | ≥ 80% other | Met | test-results.md | build-and-test | Met |
| BUILD-TYPECHECK | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| BUILD-LINT | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| BUILD-TEST | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| ENF-14 | ENF-14 | clean | OK | test-results.md | build-and-test | Met |
| NFR-PERF-LOCAL | — | — | No local NFR artifact set | performance-test-instructions.md | — | N/A |

## Readiness

| Dimension | Status |
|---|---|
| Build-ready | Yes |
| Test-ready (delivered units) | Yes |
| Deployment-ready | No — remaining units (u4+) not built; Operation skipped |

## Known limitations

1. Early jump to Build and Test before all units’ Code Generation — FR3–FR10 uncovered by design.  
2. Caisse E2E parcours (ENF-11 full path) not executable without u5-register.  
3. Vendored fast-check (npm outage during U3) — document for CI offline installs.  
4. Stage validity drift advisory still open (domain-design / units-generation).  

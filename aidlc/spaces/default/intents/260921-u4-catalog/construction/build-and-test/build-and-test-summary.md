# Build and Test Summary — U4 Catalogue

**Summary Authorization Id:** e56c314a1df420a064ff93fcaef4802a673e448faa133215e0eb5cfa5f747965

## Overall status

**Build:** success  
**Executable quality gates:** success (typecheck, lint, test, ENF-14)  
**Stage predicate:** failed — ENF-02, ENF-16 `Unverified` (→ `performance-validation`); FR3.3–FR3.8 uncovered until C2–C4  
**Halt-and-ask:** no identifiable in-stage fix (loop-backs 0/3)

## Test type inventory

| Type | Generated | Executed |
|---|---|---|
| Unit (u4 + socle) | Yes | Yes — 251 tests |
| Integration / cross-package | `integration-test-instructions.md` | Via `pnpm test` |
| Performance | `performance-test-instructions.md` | Deferred J1 |
| Security | `security-test-instructions.md` | Yes — forbidden-word + lint + role tests |

## Coverage expectations

| Area | Expected | Actual |
|---|---|---|
| domain | ≥ 90% L/B | 98.52% / 95.65% |
| db | ≥ 80% | 94.48% / 86.28% |
| pc-proof | ≥ 80% | 95.93% / 80.28% |

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| BUILD-TYPECHECK | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| BUILD-LINT | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| BUILD-TEST | team.md | exit 0 | exit 0 | test-results.md | build-and-test | Met |
| TC-DOMAIN-90 | Testing Contract | ≥ 90% | 98.52% / 95.65% | test-results.md | build-and-test | Met |
| TC-PKG-80 | Testing Contract | ≥ 80% | Met | test-results.md | build-and-test | Met |
| ENF-14 | ENF-14 | clean | OK | test-results.md | build-and-test | Met |
| ENF-08-OUTBOX | CLAUDE.md | atomic | Met | test-results.md | build-and-test | Met |
| BR3.17-MASK | CT-09 | mask costs | Met | test-results.md | build-and-test | Met |
| ENF-02-SEARCH | NFR3.1 | p95 | not measured | performance-test-instructions.md | performance-validation | Unverified |
| ENF-16-ENTRY | Testing Contract | 50/15 min | not measured | performance-test-instructions.md | performance-validation | Unverified |

## Readiness

| Dimension | Status |
|---|---|
| Build-ready | Yes |
| Test-ready (C1 executable gates) | Yes |
| Deployment-ready | No — C2–C4 remaining; ENF-02/16 pending; walking-skeleton ladder after C1 merge |

## Known limitations

1. ENF-02 and ENF-16 Unverified until J1 / `performance-validation`.  
2. CG review R-01 (search LIKE) and R-02 (ADR v3) still open before boutique.  
3. Playwright catalogue parcours due at J1, not blocking each merge.  

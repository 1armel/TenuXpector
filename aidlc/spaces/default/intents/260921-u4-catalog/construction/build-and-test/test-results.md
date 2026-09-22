# Test Results — Build and Test · U4 Catalogue

**Date:** 2026-09-22T21:05:00Z  
**Summary Authorization Id:** e56c314a1df420a064ff93fcaef4802a673e448faa133215e0eb5cfa5f747965

## Build status

| Step | Exit | Notes |
|---|---|---|
| `pnpm typecheck` | 0 | success |
| `pnpm lint` | 0 | success |
| `pnpm test` | 0 | success |
| `pnpm check:forbidden-word` | 0 | ENF-14 OK — 117 files |

## Test results

| Suite | Files | Tests | Lines | Branches |
|---|---|---|---|---|
| `test:unit` (pc-proof) | 11 | 94 | 95.93% | 80.28% |
| `test:db` | 11 | 66 | 94.48% | 86.28% |
| `test:domain` | 10 | 91 | 98.52% | 95.65% |
| **Total** | — | **251** | — | — |

All suites green. No failures.

## Coverage vs floors

| Package | Floor | Actual L / B | Verdict |
|---|---|---|---|
| `packages/domain` | ≥ 90% | 98.52% / 95.65% | Met |
| `packages/db` | ≥ 80% | 94.48% / 86.28% | Met |
| `apps/pc-proof` | ≥ 80% | 95.93% / 80.28% | Met |

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| BUILD-TYPECHECK | team.md / CLAUDE.md | exit 0 | exit 0 | `_run-log.txt` | build-and-test | Met |
| BUILD-LINT | team.md | exit 0 | exit 0 | `_run-log.txt` | build-and-test | Met |
| BUILD-TEST | team.md | exit 0 | exit 0 | `_run-log.txt` | build-and-test | Met |
| TC-DOMAIN-90 | Testing Contract / ENF-11 | ≥ 90% L/B | 98.52% / 95.65% | `_run-log.txt` | build-and-test | Met |
| TC-PKG-80 | Testing Contract | ≥ 80% L/B | db+pc-proof Met | `_run-log.txt` | build-and-test | Met |
| ENF-14 | ENF-14 | clean | OK | `_run-log.txt` | build-and-test | Met |
| ENF-08-OUTBOX | CLAUDE.md / C1 | atomic outbox | covered by catalog-service tests | packages/db/tests | build-and-test | Met |
| BR3.17-MASK | CT-09 | vendeur sans coûts | covered by domain+UI tests | catalog specs | build-and-test | Met |
| ENF-02-SEARCH | NFR3.1 | p95 recherche | not measured locally | performance-test-instructions.md | performance-validation | Unverified |
| ENF-16-ENTRY | Testing Contract | 50 fiches / 15 min | not measured locally | performance-test-instructions.md | performance-validation | Unverified |

## Failures

Executable commands: none.

**Stage failure predicate (Unverified targets):** ENF-02-SEARCH and ENF-16-ENTRY remain `Unverified` (deferred to `performance-validation`). Cross-unit: FR3.3–FR3.8 uncovered until Bolts C2–C4 (walking skeleton C1 scope).

### Diagnosis (rung 2)

- Root cause: not a scaffolding bug; NFR measures and later FRs are out of C1 / local suite remit by practices (ENF-02 at J1; ENF-16 operator-timed; C2–C4 after skeleton gate).
- Swappable dimensions checked: none (cannot Met ENF-02/16 without the deferred measurement stage; cannot claim FR3.3–3.8 without implementing C2–C4).
- Candidate fix: none identifiable for this stage.
- Loop-backs used: 0/3.

### Halt-and-ask decision

- 2026-09-22T21:12:00Z — human chose **Accept failure**. Proceed to Build and Test approval gate.

## Known follow-ups

1. ENF-02 / ENF-16 → `performance-validation` (J1).  
2. CG review R-01 (LIKE vs index) / R-02 (ADR migration v3) — before boutique.  
3. FR3.3–FR3.8 → Bolts C2–C4 after skeleton approval.  

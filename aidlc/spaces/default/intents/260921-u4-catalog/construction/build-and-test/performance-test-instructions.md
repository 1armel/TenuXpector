# Performance Test Instructions — U4 Catalogue (C1)

## Local (this stage)

No automated load bench is executed in Build and Test for C1.

| Target | Source | Local action | Owning stage |
|---|---|---|---|
| ENF-02 recherche p95 | NFR3.1 / performance-design | Measure on seed volumineux with operator or script at J1 | `performance-validation` |
| ENF-16 50 fiches / 15 min | Testing Contract | Chronométrage opérateur (médiane 3 essais) at J1 | `performance-validation` / install |

## Notes

- C1 search uses `LIKE '%needle%'` on `search_normalized` (full-scan within tenant) — see Code Generation review R-01. Acceptable until ENF-02 measured; do not claim index lookup until FTS5 or documented design amendment.
- Commands to prepare seed: use existing `packages/db` demo seed; volume seed for ENF-02 is a J1 task.

## Deferred verdict

All rows above: **Unverified** at Build and Test exit, with owning stage `performance-validation`.

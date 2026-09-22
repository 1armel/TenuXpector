# Performance test results — U4 Catalogue

**Summary Authorization Id:** 70fdc55305f2582976fe5e5e72e2c8b08c7a9ad21292d96b0ec19da632966ca0  
**Date (UTC):** 2026-09-22T23:15:00Z

## S1 — ENF-02 indicatif (seed démo 200)

| Métrique | Valeur |
|---|---|
| `productCount` | 200 |
| Rounds | 50 |
| Needles | `vis`, `ecrou`, `SKU`, `a`, `zzz-absent` |
| p50 | **0.157 ms** |
| p95 | **0.503 ms** |
| p99 | **0.516 ms** |
| max | 0.516 ms |
| Cible ENF-02 p95 | < 200 ms (sur **10k**) |

**Lecture :** largement sous 200 ms sur 200 lignes (LIKE). **Ne valide pas** ENF-02 formal (10k). Caveat R-01 (pas FTS) reste ouvert pour le volume cible.

## S3 — ENF-16 opérateur

| Champ | Valeur |
|---|---|
| Statut | **Mesuré** (Q2-B, un essai) |
| Protocole | 50 fiches minimales, clavier, une série, chrono wall-clock |
| Durée rapportée | **12 min 30 s** (`12_30`) |
| Cible | < 15 minutes |
| Verdict essai | **Met** (essai unique) |
| Médiane 3 essais | Due à J1 |

## Automations

Probe exécuté via `pnpm exec tsx` + `seedDemoDatabase` + `CatalogService.searchProducts` (main process timing, pas UI debounce).

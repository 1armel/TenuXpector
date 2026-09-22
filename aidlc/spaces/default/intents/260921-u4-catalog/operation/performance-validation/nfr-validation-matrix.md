# NFR validation matrix — Performance Validation

**Summary Authorization Id:** 70fdc55305f2582976fe5e5e72e2c8b08c7a9ad21292d96b0ec19da632966ca0

| NFR / ENF | Target | Actual | Evidence | Verdict |
|---|---|---|---|---|
| ENF-02 / NFR3.1 | p95 < 200 ms @ 10k articles | p95 0.503 ms @ **200** (indicatif) | `test-results.md` S1 | **Not Met** (critère 10k) / Indicative OK |
| ENF-16 / NFR3.2 | 50 créations < 15 min | **12 min 30 s** (1 essai) | `test-results.md` S3 | **Met** (essai unique ; médiane×3 → J1) |
| UI feedback < 100 ms | ressenti | non mesuré UI | — | Unverified |

## Notes

- ENF-02 formal (@10k) et médiane×3 ENF-16 restent dus à J1 / PC cible.
- Build and Test : ENF-16 peut passer Met pour l’essai unique ; ENF-02 reste Unverified/Not Met au critère 10k.

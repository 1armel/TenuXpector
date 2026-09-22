# Load / performance test plan — U4 Catalogue

**Summary Authorization Id:** 70fdc55305f2582976fe5e5e72e2c8b08c7a9ad21292d96b0ec19da632966ca0

## Profil (Q3-A)

| Dimension | Valeur |
|---|---|
| Acteurs | 1 opérateur caisse |
| Charge | Bursts de recherche pendant vente + saisie fiche |
| Environnement | ENV-DEV (indicatif) ; PC boutique pour critères formels J1 |
| Observabilité | Locale (chrono / `performance.now`) — pas CloudWatch |

## Scénarios

### S1 — ENF-02 recherche (Q1-B indicatif)

1. Seed démo `DEMO_PRODUCT_COUNT = 200` via `seedDemoDatabase`.
2. Warmup puis 50 appels `CatalogService.searchProducts` (needles variés, limit 50, rôle vendeur).
3. Consigner p50 / p95 / p99.
4. **Limite :** hors critère formal 10k articles — résultat **indicatif**.

### S2 — ENF-02 formal (J1)

1. Seed ≥ 10 000 articles actifs.
2. Même probe (ou UI) sur PC cible.
3. Cible : p95 < 200 ms.

### S3 — ENF-16 saisie (Q2-B)

1. Opérateur formé, clavier seul, fiche minimale 4 champs.
2. Chronométrer **une** série de 50 créations (objectif < 15 min).
3. Médiane de 3 essais → J1 (si un seul essai ici).

## Hors scope

- Load HTTP multi-client
- Autoscaling cloud

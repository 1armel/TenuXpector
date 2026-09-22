# Conception performance — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Kind `ui` ; hors ligne ; pas de CDN ni cache réseau.

## Budgets (figés Q1-A)

| ID | Cible | Mesure |
|---|---|---|
| NFR3.1 / ENF-02 | Recherche catalogue **p95 < 200 ms** sur 10 000 articles (PC Electron) | Chrono + probe automatique sur seed |
| NFR3.2 / ENF-16 | **50 créations minimales < 15 min** opérateur formé (clavier seul) | Chronométrage médiane 3 essais |
| UI feedback | Action d’interface ressentie < 100 ms (aligné ENF-01) | Debounce + rendu local |

## Stratégies

### Recherche (NFR3.1)

- Debounce court côté renderer (≈ 50–80 ms) ; une seule requête IPC en vol (annuler / ignorer les réponses périmées).
- Index SQLite sur les colonnes de recherche normalisées (casse/accents) — `internal_code`, designation, synonymes, barcode.
- Projection légère `ProductSummary` (pas de coûts) ; `limit` borné (ex. 50).
- Pas de full-scan UI : le main applique BR3.4 en SQL/index, pas en filtrant 10k lignes en JS.

### Saisie en série (NFR3.2)

- Aucun aller-retour liste entre deux créations (BR3.10).
- `catalog.saveProduct` synchrone local ; budget save < 300 ms ressenti (transaction SQLite + outbox).
- Suggestion de prix (BR3.13) calculée en mémoire — aucun I/O.

### Import / photo

- Preview paginée / virtuelle si > quelques centaines de lignes.
- Commit import : timeout IPC 60 s (C-01) ; progress UI ; pas de blocage du thread UI (travail main).
- OCR preview : timeout 120 s ; spinner + annulation utilisateur.

## Non-objectifs perf

- CDN, Redis, cache HTTP.
- Optimisation sync cloud (hors U4).
- Parité tablette Android (ENF-15) — hors périmètre UI U4 PC.

# Conception monitoring — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Q2-A : logs locaux structurés ; pas de stack cloud.

## Metrics & KPIs

| Metric | Source | Threshold | Why it matters |
|---|---|---|---|
| `catalog.search.latency_ms` (p95) | main chronomètre IPC | < 200 ms (NFR3.1 / ENF-02) | Recherche ressentie |
| `catalog.save.latency_ms` | main | < 300 ms ressenti | Saisie série ENF-16 |
| `catalog.import.commit_ms` | main | < 60 s (timeout C-01) | Gros fichiers |
| `catalog.ocr.preview_ms` | main | < 120 s | UX photo |
| `catalog.ipc.error_count` | main | alerte si spike | Santé pont |

## Alerts

| Alert | Condition | Severity | Routes to |
|---|---|---|---|
| Search slow | p95 search > 200 ms sur fenêtre courte | Warning | Log local + toast opérateur optionnel |
| Save failed | `DATABASE_FAILED` / transaction abort | Error | Log local structuré |
| OCR unavailable | `OCR_UNAVAILABLE` | Warning | UI message ; clavier/import restent |
| Printer unavailable | `PRINTER_UNAVAILABLE` | Warning | UI étiquette |
| Forbidden role | `FORBIDDEN_ROLE` sur mutation | Info/audit | journal_audit |

## SLIs / SLOs

| SLI | SLO target | Measurement window |
|---|---|---|
| Search latency | p95 < 200 ms sur seed 10k | Build / recette PC |
| Création minimale ×50 | < 15 min opérateur formé | Chrono ENF-16 (3 essais) |
| Disponibilité onglet Catalogue | IPC local répond (pas de dépendance réseau) | Session caisse |

## Logs & Tracing

| Aspect | Choice |
|---|---|
| Agrégation | Fichier / console main Electron — **pas** d’agrégateur cloud en U4 |
| Contenu | Niveau, canal (`catalog.*`), durée, `tenant_id` ; **jamais** PIN, prix d’achat, jeton, image OCR |
| Correlation | `requestId` / id IPC par appel |
| Dashboards | Aucun cloud ; éventuel écran diag local hors scope U4 |

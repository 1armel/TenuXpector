# Composants logiques NFR — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Pont vers Infrastructure Design / code : où s’appliquent perf et sécu.

## Inventaire

| Composant logique | Couche | NFR appliqués | Blast radius si panne |
|---|---|---|---|
| CatalogSearchIndex | db / main | NFR3.1 | Recherche lente ; vente reste possible via cache mémoire caisse si déjà chargée |
| CatalogDomain (packages/domain) | domain | NFR3.2 validation | Refus métier ; pas d’écriture partielle |
| CatalogIpcBridge | Electron main↔renderer | NFR3.3, NFR3.4 | Onglet Catalogue indisponible ; caisse vente intacte |
| SensitiveDataGuard | domain (réutilisé) | NFR3.4 | Si contourné → fuite coûts — tests obligatoires |
| TransactionalWriter | db | NFR3.3 audit | Écriture refusée en bloc ; pas de demi-article |
| TextRecognitionPort | adaptateur | NFR3.5 | Photo indisponible ; clavier + import restent |
| CatalogUi RoleGate | renderer | NFR3.4 | Défense UI seule insuffisante — jamais s’y fier seule |

## Domaines de défaillance

```
┌─ Renderer (CatalogUi) ─────────────────────────┐
│  RoleGate · Search · Form · Wizard             │
└─────────────── IPC Zod ────────────────────────┘
┌─ Main ─────────────────────────────────────────┐
│  CatalogDomain · Guard · Writer · OCR port     │
│  SQLite chiffrée + index recherche             │
└────────────────────────────────────────────────┘
```

- Panne OCR ≠ panne catalogue clavier/import.
- Panne index recherche ≠ corruption données (reindex / rebuild possible).
- Isolation : aucune règle métier dans le renderer.

## Ressources partagées

| Ressource | Partagée avec | Contrainte |
|---|---|---|
| SQLite locale | Caisse u3 | Même `tenant_id` ; pas de DELETE articles |
| Session / rôle | Shell caisse | Source unique d’authz |
| Imprimante ESC/POS | Étiquettes + tickets | Timeout `PRINTER_UNAVAILABLE` |

## Décisions reportées à l’infra / code

- Migrations index recherche (packages/db).
- Choix bibliothèque OCR on-device (C4 / ADR).
- Seed catégories (R-01 functional-design) — lecture seule en U4.

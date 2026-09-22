# Dépendances entre unités — U4 Catalogue

Entrée : `unit-of-work.md`. Topologie seulement — pas d’ordre de construction ni de chemin critique.

## Graphe machine

```yaml
units:
  - name: u4-catalog
    kind: ui
    depends_on: []
```

## Diagramme

```mermaid
graph LR
  u4[u4-catalog]
```

Une seule unité dans ce record. Graphe acyclique (trivial).

## Dépendance hors record (prose)

| Lien | Raison |
|---|---|
| `u4-catalog` s’appuie sur le code déjà sur `main` (u1–u3 / fondation / domaine / caisse) | Schéma articles, TransactionalWriter, SensitiveDataGuard, shell Electron, vente déjà livrée |

Ces nœuds **ne sont pas** re-déclarés dans le YAML : ils appartiennent à une intention antérieure / au trunk.

## Intégration

| Point | Mécanisme |
|---|---|
| Règles ↔ UI | Appels sync locaux (IPC Electron) Catalog / Import / Capture → CatalogUi |
| Persistance | TransactionalWriter → SQLite locale + outbox |
| Impression étiquette | Adaptateur ESC/POS USB déjà livré |
| OCR | Dépendance externe de CatalogCapture |

## Parallélisme

Avec une seule unité, aucun couple d’unités indépendantes dans ce DAG. Le parallélisme éventuel est **intra-unité** (Bolts C2 ∥ C3 après C1) — à trancher en Delivery Planning, pas ici.

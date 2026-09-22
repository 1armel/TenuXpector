# Unités de travail — U4 Catalogue

Entrées : `components.md`, `decisions.md`, plan approuvé (Q1–Q3 = A, Approve Plan).

Cette page décrit **ce que contient l’unité** et **ce dont elle dépend dans ce record**. Elle ne choisit pas l’ordre de construction (Delivery Planning). Le socle u1–u3 est déjà sur `main` ; il n’apparaît pas dans le DAG local.

## Table des unités

| Unit ID | Nom | Directory | Kind | Taille | Modèle de livraison |
|---|---|---|---|---|---|
| U4 | Catalogue et saisie | `u4-catalog` | ui | L | Embarqué dans la caisse (`apps/pc-proof`) |

## Détail — U4 Catalogue et saisie (`u4-catalog`)

**Ce qu’elle livre.** Fiche article, recherche, saisie clavier rapide (ENF-16), désactivation / code interne / étiquette, import générique sans stock, photo du registre avec vérification et adaptateur OCR figé.

**Composants construits.** Catalog, CatalogImport, CatalogCapture, CatalogUi ; extension de SensitiveDataGuard (usage) et TransactionalWriter (persistance catalogue + outbox).

**Frontière.**
- Import et photo : articles et prix seulement, **jamais** de quantité / mouvement de stock.
- OCR isolé derrière CatalogCapture ; CR-02 (pas d’image ni prix d’achat chez un tiers avant spécimen).
- Aucune règle métier dans CatalogUi ; domaine dans `packages/domain`, tests d’abord.
- Pas d’écran de vente / encaissement / clôture (déjà u3) ; pas d’app propriétaire ; pas d’UI tablette.

**Correspondance.** Unité produit U2 du document d’exigences (EF-U2-* / FR3.1–FR3.8). Identifiant de travail **U4** / dossier `u4-catalog` aligné sur le plan V1.

**Bolts internes (pas des unités).** C1 fiche/recherche/rôles ; C2 clavier/désactivation/étiquette ; C3 import ; C4 photo. Leur enchaînement économique relève de Delivery Planning.

**Dépend de (hors DAG local).** Socle déjà livré sur `main` (preuve PC, fondation, domaine u3, caisse). Dans ce record : `depends_on: []`.

**Notes.** Une famille d’articles de démonstration doit être vendable à la caisse existante à J1 ; moyen OCR figé à J2.

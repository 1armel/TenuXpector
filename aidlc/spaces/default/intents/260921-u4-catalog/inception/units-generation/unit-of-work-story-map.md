# Carte des exigences par unité — U4 Catalogue

Aucune histoire utilisateur (étape sautée). Carte des **FR3.1–FR3.8** (périmètre U4 / exigences catalogue) vers l’unité de travail.

## Couverture par unité

| Unité | Dossier | Exigences couvertes | Nombre |
|---|---|---|---|
| U4 | `u4-catalog` | FR3.1, FR3.2, FR3.3, FR3.4, FR3.5, FR3.6, FR3.7, FR3.8 | 8 |

**Total : 8 / 8 rattachées.**

## Détail

| Exigence | Unit ID | Directory | Contenu principal |
|---|---|---|---|
| FR3.1 Fiche article | U4 | `u4-catalog` | Catalog + CatalogUi |
| FR3.2 Recherche | U4 | `u4-catalog` | Catalog + CatalogUi |
| FR3.3 Import fichier | U4 | `u4-catalog` | CatalogImport + CatalogUi |
| FR3.4 Import sans stock | U4 | `u4-catalog` | CatalogImport |
| FR3.5 Photo registre | U4 | `u4-catalog` | CatalogCapture + CatalogUi |
| FR3.6 Moyen OCR figé | U4 | `u4-catalog` | CatalogCapture |
| FR3.7 Saisie clavier rapide | U4 | `u4-catalog` | Catalog + CatalogUi |
| FR3.8 Désactivation / étiquette | U4 | `u4-catalog` | Catalog + CatalogUi (+ impression existante) |

## Exigences transverses (vérif ailleurs)

| Exigence | Construite dans | Aussi vérifiée | Pourquoi |
|---|---|---|---|
| FR3.1–FR3.2 | U4 | Caisse déjà livrée (ajout ticket) | Les articles créés doivent être trouvables à la vente |
| CT-09 / masquage | SensitiveDataGuard (socle) | U4 CatalogUi | Vendeur sans coûts sur l’onglet Catalogue |

## Ordre interne (Bolts — informatif)

Non prescriptif pour Delivery Planning. Rappel du carnet : C1 → (C2 ∥ C3) → C4.

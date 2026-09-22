# Composants frontend — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Cible desktop Electron (caisse) ; clavier-first. Aucune règle métier dans ces composants — elles vivent en BR3.x / domaine.

Aligné sur maquettes raffinées + `design-system-mapping.md`. Tokens existants de la coquille caisse (pas de kit UI tiers).

## Hiérarchie

```
CatalogShell
├── RoleGate                          # masque actions / nœuds selon rôle (BR3.17)
├── CatalogToolbar                    # Importer | Photo | À compléter (propriétaire/gérant)
├── CatalogSearchPane
│   ├── CatalogSearch                 # combobox
│   └── CatalogResultList             # listbox
├── ArticlePane
│   ├── ArticleForm                   # création / édition / lecture
│   ├── PriceSuggestion               # bandeau suggestion multiple (BR3.13)
│   └── ArticleActions                # Enregistrer | Dupliquer | Désactiver | Étiquette
├── IncompleteArticlesList            # écran « à compléter »
└── ImportPhotoWizard                 # C3/C4 étapes 1–4
    ├── SourceStep
    ├── MappingOrExtractStep
    ├── PreviewTable                  # partagée import/photo
    └── CommitStep
```

## Matrice rôle → surface

| Surface | Vendeur | Gérant / Propriétaire |
|---|---|---|
| Recherche + résultats | Oui | Oui |
| Fiche lecture | Oui (sans coûts) | Oui |
| Création / série / duplication | Non | Oui |
| Désactiver / étiquette | Non | Oui |
| Import / photo / à compléter | Non | Oui |

## CatalogShell

| Champ | Valeur |
|---|---|
| Rôle | Layout onglet Catalogue |
| État | `default` \| `wizard` \| `complete-list` \| `seller` |
| Focus initial | CatalogSearch |
| Clavier | Tab entre panneaux ; ne vole pas le focus pendant la frappe recherche |

## CatalogSearch + CatalogResultList

| Champ | Valeur |
|---|---|
| Entrées | `query`, `role`, callbacks change/select |
| Comportement | Debounce court ; ↓↑ parcours ; Entrée ouvre fiche (éditeurs) |
| ARIA | combobox + listbox + `aria-activedescendant` |
| États | `default` \| `typing` \| `loading` \| `empty` \| `error` |
| Données | `catalog.search` → `ProductSummary[]` (déjà filtrés BR3.17 côté main) |

## ArticleForm

| Champ | Valeur |
|---|---|
| Champs requis (création) | Désignation, Unité de base, Prix de vente, Prix plancher (BR3.9) |
| Facultatifs | Synonymes, catégorie, emplacement, seuil, code-barres, prix d’achat |
| Validation UI | Affiche erreurs renvoyées par `catalog.saveProduct` sous le champ |
| Mode série | Après succès : conserve catégorie / unité / emplacement ; focus désignation (BR3.10) |
| Vendeur | Champs coûts **non montés** (pas grisés) |
| IPC | `catalog.getProduct`, `catalog.saveProduct` |

## PriceSuggestion

| Champ | Valeur |
|---|---|
| Entrée | Montant saisi + `prix.multiple_conseille` |
| Action | Appliquer suggestion **ou** ignorer (BR3.13) |
| Affichage | Écart en FCFA à côté du champ |

## ArticleActions

| Action | IPC / effet | Garde |
|---|---|---|
| Enregistrer | `catalog.saveProduct` | rôle ; BR3.2 |
| Dupliquer | mode `duplicate` puis édition (BR3.11) | rôle |
| Désactiver | `catalog.deactivate` (BR3.14) | confirmation |
| Étiquette | `catalog.printLabel` (BR3.15) | imprimante |

## IncompleteArticlesList

| Champ | Valeur |
|---|---|
| Contenu | Articles manquant prix d’achat / seuil / emplacement |
| Tri | Nombre de ventes décroissant |
| Interaction | Clic → ArticleForm prérempli |

## ImportPhotoWizard + PreviewTable

| Étape | Import | Photo |
|---|---|---|
| 1 Source | Fichier CSV/Excel sur disque | Image sur disque |
| 2 | Mapping colonnes | Extraction + édition lignes |
| 3 | PreviewTable partagée (`ok`/`warn`/`error`/`duplicate`) | Idem |
| 4 | `catalog.importCommit` + rapport | `catalog.captureCommit` lignes acceptées |

- Jamais de colonne coût pour le vendeur (BR3.17).
- Pas d’envoi réseau depuis le renderer (BR3.8).
- Une ligne `error` n’empêche pas le commit des autres (BR3.5).

## Contrats d’intégration (IPC)

Voir `contract-summary.md` C-01. Tous les appels : Zod strict, `Result`/`Failure`, timeouts locaux. CatalogUi n’écrit pas SQLite directement.

## Validation formulaires (résumé)

| Champ | Règle UI | Règle domaine |
|---|---|---|
| Désignation | requis, non vide | BR3.9 |
| Prix / plancher | entiers ≥ 0 | BR3.2, BR3.13 |
| Synonymes | texte, virgules | BR3.12 |
| Unité de base | requis à la création | BR3.3 |

## Accessibilité (rappel)

- Contraste texte ≥ 4.5:1 ; focus visible ≥ 2 px.
- Labels visibles en français ; montants « 12 500 FCFA ».
- Wizard : étapes annoncées ; PreviewTable navigable au clavier.

# Mapping design system — Catalogue U4

`apps/pc-proof` n’a pas encore de bibliothèque de composants catalogue : la preuve PC actuelle est minimale (`App.tsx` + `styles.css`). U4 **étend** cette base plutôt que d’introduire un design system tiers.

## Tokens existants à réutiliser

| Token / motif | Source actuelle | Usage catalogue |
|---|---|---|
| Police | `'Segoe UI', 'IBM Plex Sans', system-ui` | Conservée |
| Fond | Dégradé clair `#f7f4ef` → `#eef3f8` | Conservé pour cohérence caisse |
| Texte | `#1c2430` | Corps |
| Texte secondaire | `#4a5565` | Indices, compteurs |
| Bouton primaire | fond `#2f3b4a`, texte `#f8fafc` | Enregistrer, Valider import |
| Bordure panneau | `#d0d7e2` | Panneaux recherche / fiche |
| OK | `#146c43` | Succès, lignes import OK |
| Erreur | `#a61b1b` | Erreurs inline / lignes rejetées |
| Panneau | `rgba(255,255,255,0.72)` + bordure | CatalogShell panels |

## Composants à créer (kebab-case fichiers)

| Composant UI | Fichier prévu | Mappe vers |
|---|---|---|
| CatalogShell | `catalog-shell.tsx` | layout onglet |
| CatalogSearch | `catalog-search.tsx` | combobox |
| CatalogResultList | `catalog-result-list.tsx` | listbox |
| ArticleForm | `article-form.tsx` | formulaire |
| PriceSuggestion | `price-suggestion.tsx` | bandeau RG-01 |
| ImportPhotoWizard | `import-photo-wizard.tsx` | wizard |
| PreviewTable | `preview-table.tsx` | prévisualisation partagée |
| RoleGate | `role-gate.tsx` | masquage vendeur (ne pas rendre les nœuds coûts) |

Pas de dépendance UI externe imposée à ce stade (pas de MUI/Chakra). Si un kit est choisi plus tard : ADR + ne pas casser le clavier-first.

## Breakpoints

| Breakpoint | Comportement |
|---|---|
| desktop (≥ 1024 px) | Deux colonnes recherche \| fiche — **cible U4** |
| étroit (768–1023) | Empilement : recherche puis fiche ; acceptable hors boutique |
| mobile (< 768) | Hors priorité U4 (tablette Android hors périmètre) |

## Libellés (FR)

| Concept | Libellé UI |
|---|---|
| internal_code | Code interne |
| designation | Désignation |
| designation_alt | Synonymes |
| floor_price | Prix plancher |
| reference sale price | Prix de vente |
| deactivate | Désactiver |
| import | Importer un fichier |
| photo | Photo du registre |
| incomplete | Articles à compléter |

Montants : « 12 500 FCFA ». Dates : JJ/MM/AAAA. Fuseau affiché : Africa/Douala.

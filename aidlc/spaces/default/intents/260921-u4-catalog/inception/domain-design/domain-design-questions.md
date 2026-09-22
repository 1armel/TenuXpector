# Conception du domaine — Questions (U4 Catalogue)

Brownfield : le catalogue de composants de l’intention caisse (`Catalog`, `CatalogCapture`, `SensitiveDataGuard`, …) et les paquets `packages/domain`, `packages/db`, `apps/pc-proof` existent déjà. Requirements analysis est sautée — on s’appuie sur le périmètre U4, EF-U2-* et les maquettes. Option A = recommandation.

## Q1. Où vivent les règles catalogue, l’import fichier et la photo ?

Contexte : le domaine U3 a déjà `Catalog` (fiche, recherche, validation) et `CatalogCapture` (photo → vérification → création). U4 ajoute l’import générique (mapping + prévisualisation) et fige l’OCR. Les pratiques placent les règles tests-d’abord dans `packages/domain`.

A. Garder **Catalog** pour fiche / recherche / désactivation / validation d’une ligne ; ajouter **CatalogImport** pour l’import fichier (mapping, prévisualisation, rapport) ; garder **CatalogCapture** pour la photo — les deux convergeant vers Catalog pour créer les articles ; OCR = dépendance externe de CatalogCapture, pas un composant
B. Un seul composant **Catalog** pour fiche, import et photo
C. Tout le catalogue (règles + UI + OCR) dans l’application `pc-proof` seulement
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q2. Qui possède l’UI catalogue des maquettes ?

Contexte : maquettes = onglet Catalogue dans la caisse, wizard partagé, masquage vendeur. `apps/pc-proof` est le livrable ; pas d’`apps/caisse` dans U4.

A. Un composant **CatalogUi** (renderer Electron) : écrans, clavier, wizard ; appelle les règles via IPC / adaptateurs locaux ; ne possède aucune règle métier ni schéma
B. Fusionner l’UI dans le composant Catalog du domaine
C. Nouvelle application séparée pour le catalogue
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q3. Qui écrit articles + outbox de façon atomique ?

Contexte : invariant : mutation et événement `outbox` dans la même transaction. U3 a déjà un composant d’écriture transactionnelle.

A. Réutiliser **TransactionalWriter** (ou équivalent déjà tranché) : Catalog / CatalogImport / CatalogCapture produisent des commandes validées ; l’écrivain persiste `products` / unités + `outbox` ensemble dans `packages/db`
B. Chaque composant catalogue ouvre sa propre transaction et écrit l’outbox
C. Pas d’outbox pour les mutations catalogue dans U4
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q4. Le masquage vendeur (CT-09) reste-t-il un composant dédié ?

Contexte : U3 a tranché `SensitiveDataGuard`. Les maquettes exigent l’absence des nœuds coûts dans le DOM pour le vendeur.

A. Oui : **SensitiveDataGuard** reste le seul filtre de lecture des coûts ; CatalogUi et toute API future l’utilisent — pas de second filtre ad hoc dans Catalog
B. Catalog filtre lui-même selon le rôle, sans SensitiveDataGuard
C. Filtrage uniquement dans le CSS / `hidden` côté UI
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses :

- **Découpage catalogue** : Catalog (règles fiche/recherche) + CatalogImport (fichier) + CatalogCapture (photo) ; OCR = dépendance externe de CatalogCapture (Q1).
- **UI** : CatalogUi dans `apps/pc-proof` — écrans et wizard, aucune règle métier (Q2).
- **Persistance** : TransactionalWriter réutilisé pour articles + outbox atomiques (Q3).
- **Masquage** : SensitiveDataGuard reste le filtre unique CT-09 (Q4).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]:Looks correct

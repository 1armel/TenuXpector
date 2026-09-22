# Maquettes raffinées — Questions

Pas de maquettes ni d’histoires utilisateur en amont (étapes sautées). On dessine l’UI catalogue **à partir du périmètre U4** (C1→C4), des pratiques affirmées et de la caisse déjà livrée. Option A = recommandation.

## Q1. Comment entrer dans le catalogue depuis la caisse ?

Contexte : l’UI est embarquée dans `apps/pc-proof`. Le vendeur ne fait que rechercher ; le propriétaire / gérant crée et modifie.

A. Un onglet ou entrée « Catalogue » dans la caisse : le vendeur y voit surtout la recherche ; le propriétaire / gérant voit aussi création, import et photo
B. Un écran catalogue séparé, hors du parcours de vente (fenêtre ou route dédiée)
C. Seulement depuis le ticket de vente (recherche à l’ajout d’article) ; pas d’écran catalogue dédié
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q2. Quel écran prioritaire pour la première tranche C1 (fiche + recherche) ?

Contexte : ENF-16 vise la création rapide au clavier. La vente a déjà une recherche d’articles.

A. Deux zones sur le même écran : recherche + résultats à gauche (ou en haut) ; fiche / création à droite (ou en bas) — le vendeur n’a que la recherche
B. Liste d’abord, fiche en détail / tiroir latéral
C. Formulaire de création plein écran d’abord ; la recherche est un autre écran
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q3. Comment enchaîner l’import fichier et la photo (C3 / C4) ?

Contexte : import = mapping de colonnes + prévisualisation ; photo = fichier image + vérification avant import. Les deux réutilisent un chemin de validation.

A. Assistants en étapes (fichier → mapping ou OCR → prévisualisation → valider) ; même écran de prévisualisation pour import et photo
B. Import et photo sur des écrans totalement séparés, sans partage de prévisualisation
C. Tout sur un seul écran dense, sans étapes
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q4. Quel niveau d’accessibilité et de clavier ?

Contexte : PC / Electron d’abord, pas de lecteur de codes-barres ; la tablette n’est pas dans cette intention. WCAG 2.1 AA est la cible usuelle.

A. WCAG 2.1 AA ; tout le catalogue utilisable au clavier (Tab, Entrée, Échap) ; contrastes et libellés visibles ; cibles tactiles non prioritaires pour U4
B. AA, **plus** cibles 44×44 et adaptation tactile dès U4 (préparer la tablette)
C. Accessibilité minimale (clavier seulement), sans viser AA
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]:Looks correct

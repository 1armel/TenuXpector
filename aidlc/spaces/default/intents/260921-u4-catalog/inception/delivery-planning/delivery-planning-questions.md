# Plan de livraison — Questions (U4 Catalogue)

Une seule unité de travail `u4-catalog` dans le DAG. Les **Bolts** (tranches de construction avec critère de fin) découpent C1–C4 à l’intérieur. Les pratiques : C1 = squelette marchant, porte explicite ; puis autonomie ou porte par Bolt. Option A = recommandation.

## Q1. Que construire en premier ?

Contexte : WSJF informel du carnet — clavier/import débloquent la vente ; photo réduit le risque de saisie longue mais n’est pas le chemin critique de J1. Les pratiques imposent un premier Bolt bout-en-bout.

A. **Squelette marchant (C1)** d’abord : fiche + recherche + masquage rôles dans `pc-proof`, vendable à la caisse ; puis valeur (C2/C3) ; la photo (C4) après pour figer l’OCR
B. Risque d’abord : C4 (OCR) avant toute UI catalogue
C. Tout C1–C4 en un seul Bolt
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q2. Après C1, C2 et C3 en parallèle ou en série ?

Contexte : le carnet dit C2 ∥ C3 possibles après C1. Une seule personne sur le projet.

A. **Série** : C2 puis C3 (ou C3 puis C2) — un seul opérateur ; ordre recommandé **C2 puis C3** (ENF-16 avant import) sauf blocage
B. **Parallèle** C2 et C3 (deux worktrees) même en solo
C. Fusionner C2 et C3 en un Bolt
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q3. Portes d’approbation entre Bolts ?

Contexte : pratiques — approuver C1 explicitement, puis choisir autonomie ou porte à chaque Bolt.

A. **Porte après C1** (obligatoire) ; ensuite **autonomie** jusqu’à J1 (fin C2+C3) et **porte avant C4 / J2**
B. Porte après chaque Bolt C1, C2, C3, C4
C. Aucune porte ; tout enchaîné
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q4. Qui construit ?

Contexte : intention solo / propriétaire du dépôt.

A. **Une personne** (toi) sur tous les Bolts ; pas d’allocation multi-équipes
B. Deux personnes (domaine vs UI) dès C1
C. Pas encore défini
D. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Plan de livraison proposé :

- **Ordre** : C1 (squelette) → C2 (clavier) → C3 (import) → C4 (photo / OCR figé)
- **Portes** : après C1 ; autonomie jusqu’à J1 ; porte avant C4 / J2
- **Équipe** : une personne
- **Unité runtime** : toujours `u4-catalog` (un nœud DAG) ; les Bolts sont des tranches de construction planifiées

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]:Looks correct

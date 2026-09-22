# Conception des contrats — Questions (U4 Catalogue)

Une seule unité `u4-catalog` dans le DAG local, mais des **frontières réelles** : IPC Electron (renderer ↔ main), schéma SQLite partagé avec le socle, et éventuellement OCR. Option A = recommandation.

## Q1. Quel est le contrat principal à figer pour CatalogUi ↔ domaine / db ?

Contexte : l’UI est dans le renderer ; les règles et l’écriture sont hors renderer (main / paquets). Zod est déjà la frontière IPC du projet.

A. Contrats **IPC** validés Zod (canaux nommés, payloads typés) + **schéma partagé** des tables catalogue (`products`, unités) — pas d’API HTTP publique dans U4
B. API HTTP REST OpenAPI locale en plus de l’IPC
C. Pas de contrat formel ; types TypeScript partagés seulement
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q2. Comment traiter l’OCR / reconnaissance de texte ?

Contexte : CR-02 ; moyen figé en fin U4 ; peut rester sur l’appareil.

A. Contrat **adaptateur** interne (interface TypeScript + erreurs typées) ; si un service tiers est un jour retenu, son API est un contrat **externe** séparé, sans prix d’achat ni image avant spécimen — documenté mais non branché tant que CR-02 tient
B. Spécifier dès maintenant un OpenAPI vers un fournisseur OCR nommé
C. Aucun contrat OCR dans cette étape
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q3. Qui possède les contrats et la politique de rupture ?

Contexte : une seule unité de travail dans cette intention ; le socle est déjà sur `main`.

A. **u4-catalog** possède les specs IPC catalogue et l’adaptateur OCR ; le schéma SQL catalogue reste gouvernance `packages/db` (migrations) — changements cassants = migration + ADR ; champs inconnus ignorés côté consommateur IPC
B. Chaque paquet possède son contrat sans règle commune
C. Pas encore défini
D. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé :

- **Contrats U4** : IPC Zod (CatalogUi ↔ main) + schéma SQL partagé catalogue ; pas d’HTTP public (Q1).
- **OCR** : adaptateur interne typé ; contrat externe tiers documenté mais non branché sous CR-02 (Q2).
- **Propriété** : u4-catalog pour IPC/OCR ; migrations `packages/db` pour le SQL ; rupture = migration + ADR ; champs inconnus ignorés (Q3).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]:Looks correct

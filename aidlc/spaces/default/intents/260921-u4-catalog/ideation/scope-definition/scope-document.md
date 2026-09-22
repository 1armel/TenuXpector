# Document de périmètre — U4 Catalogue et saisie

Entrées : `intent-statement.md`, `feasibility-assessment.md`, `constraint-register.md`, et les réponses confirmées de `scope-definition-questions.md`.

Cette intention construit **une seule unité déjà nommée** : `u4-catalog` (exigences FR3.1 à FR3.8 / EF-U2-*). Ce n’est pas la V1 produit, ni l’unité « Impression » du document d’exigences historique.

## Frontière de U4

### Dans le périmètre

| Domaine | Contenu | Priorité | Origine |
|---|---|---|---|
| Fiche article | Code interne unique par tenant, plancher ≤ prix de référence, au moins une unité de vente ; masquage prix d’achat / CUMP / marge selon le rôle | Must | FR3.1, CT-09, intention |
| Recherche | Fragment de désignation, synonyme, code interne ou code-barres, casse et accents ignorés | Must | FR3.2 |
| Saisie clavier rapide | Création minimale à quatre champs, saisie en série, duplication, complétude différée, synonymes | Must | FR3.7, ENF-16 |
| Désactivation et étiquette | Jamais de suppression ; code interne et étiquette pour un article sans code-barres | Must | FR3.8 |
| Import générique | Prévisualisation, mapping de colonnes à l’écran, ligne en erreur non bloquante, réimport sans doublon ; **articles et prix seulement, aucun mouvement de stock** | Must | FR3.3, FR3.4, CT-05, périmètre Q3-A |
| Photo du registre | Fichier image déjà sur le PC ; extraction désignations et prix de vente ; écran de vérification obligatoire avant import | Must | FR3.5, CT-04, périmètre Q1-C |
| Moyen de reconnaissance | Preuve de concept des deux voies (sur l’appareil et outil/service connu), puis **moyen tranché et figé** avant de déclarer U4 terminé | Must | FR3.6, CO-04, périmètre Q1-C |
| Démo hors boutique | Au moins une famille d’articles saisie (clavier et/ou import) et utilisable à la caisse déjà livrée ; données de démonstration | Must | Intention, CO-03, périmètre Q4-A |

**Must** : indispensable à la fin de **cette** intention. Rien n’est reporté en Should à l’intérieur de U4.

### Hors du périmètre de cette intention

| Élément | Raison |
|---|---|
| Quantités / mouvements de stock à l’import | FR3.4 ; périmètre Q3-A ; quantités à l’installation en boutique |
| Écran de vente, encaissement, clôture | Déjà livré (u3) ; périmètre Q3-B |
| Impression ticket, application propriétaire, serveur, compte AWS | Hors U4 ; CT-07 ; périmètre Q3-C |
| UI catalogue spécifique tablette Android | Caisse PC / Electron d’abord ; périmètre Q3-D |
| Moteur de reconnaissance maison | CT-06, R-06 |
| Connecteur fournisseur ou autre système métier | Faisabilité Q1-A, CT-02 |
| Attendre le registre papier réel pour la démo | Périmètre Q4-A, condition 3 de faisabilité |

### Réconciliation Q1-C / spécimen (CR-02)

Figer le moyen dans U4 (périmètre Q1-C) **ne lève pas** l’interdiction d’envoyer une image à un tiers avant d’avoir vu un spécimen du registre (CR-02, I-01).

- Si un spécimen arrive pendant U4 : on compare les deux voies, on tranche, on fige l’adaptateur.
- Si le spécimen n’arrive pas : on fige **la voie sur l’appareil** (seule compatible avec CR-02). Un service tiers n’est pas retenu.

La démo n’attend pas le registre complet (périmètre Q4-A).

## Jalons

Ordre de construction **valeur d’abord** (périmètre Q2-A) : le catalogue clavier/import débloque la vente ; la photo se fige ensuite, avant la fin d’unité.

| Jalon | Contenu | Critère de fin | Lieu |
|---|---|---|---|
| J1 — Catalogue opérable | Fiche, recherche, saisie clavier, désactivation / étiquette, import générique | Une famille d’articles de démonstration est saisie (clavier **et** au moins un fichier mappé) et vendable à la caisse ; cible ENF-16 mesurable sur 50 créations minimales | Ton PC, données de démonstration |
| J2 — Photo figée (fin U4) | Preuve de concept des deux voies, écran de vérification, adaptateur figé selon la règle CR-02 ci-dessus | Une page d’image de démonstration passe par vérification → articles ; le moyen retenu est unique et branché ; démo hors boutique puis unité suivante | Ton PC ; images déjà sur le disque |

Pas de date calendaire (périmètre Q4-A, CO-02).

## Contraintes qui bornent le périmètre

Détail dans `constraint-register.md`. Celles qui délimitent U4 :

- **Embarqué dans la caisse déjà livrée** (CT-01) — pas une application propriétaire.
- **Hors ligne pour tout le métier de caisse** (CT-03) — un appel HTTPS, s’il est retenu, ne concerne que l’import photo.
- **Import = mapping générique** (CT-05) — pas un unique format Excel/CSV câblé.
- **Pas de compte AWS** (CT-07).
- **Vendeur sans coûts** (CT-09) — y compris à l’écran de vérification photo.
- **Prix d’achat jamais chez un tiers** (CR-01, CR-02).

## Points ouverts

- Le spécimen du registre (A-01, D-01) reste une **dépendance de la décision OCR**, pas de la démo J1.
- Le format exact du premier fichier réel reste inconnu (CT-05) : l’import générique est le filet.
- L’unité suivante après U4 n’est pas dans cette intention (impression, sync, etc. selon le carnet V1 déjà existant).

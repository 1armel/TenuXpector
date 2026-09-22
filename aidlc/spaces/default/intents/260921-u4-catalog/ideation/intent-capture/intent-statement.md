# Déclaration d'intention — U4 Catalogue et saisie

Chaque affirmation porte sa source : `[desc]` pour la description initiale, `[Q<n>]` pour la réponse confirmée à la question n de `intent-capture-questions.md`, `[scope]` pour le plan de travail choisi, `[memory:M<n>]` pour une règle de projet enregistrée.

## Énoncé du problème

Construire l'unité U4 Catalogue et saisie (`u4-catalog`) : l'interface catalogue (fiche article, recherche, saisie rapide, import de fichier, saisie par photo du registre) embarquée dans la caisse, sur le socle u1–u3 déjà livré. [desc]

Cette unité doit résoudre **deux** problèmes à la fois : [Q1]

- Débloquer la vente réelle : sans articles et prix dans le système, le parcours de caisse déjà livré ne sert pas en boutique. [Q1]
- Remplacer la saisie papier du registre du propriétaire par un outil rapide (clavier, import, éventuellement photo), sans erreur bloquante sur un catalogue très large. [Q1]

Le catalogue à saisir couvre les exigences déjà identifiées : fiche article, recherche, import sans quantité, saisie clavier rapide, désactivation et étiquette, **et** saisie par photo du registre avec choix du moyen de reconnaissance. [Q9]

## Client cible

Le propriétaire saisit et maintient le catalogue ; le gérant peut aussi le faire en boutique. [Q2] [Q5]

Les vendeurs n'utilisent l'interface catalogue que pour **rechercher** un article à la vente : ils ne créent ni ne modifient les fiches, et ne voient jamais prix d'achat, CUMP, marge, CA cumulé ni valorisation. [Q2] [memory:M2]

Le bénéfice principal est un catalogue réel, prêt pour la caisse, saisi sans formation lourde. [Q2] [Q5]

## Indicateurs de succès

- Le catalogue réel de la boutique est importé ou saisi sans erreur bloquante. [Q3]
- L'ergonomie à grand volume est respectée de façon mesurable : créer 50 articles au minimum requis prend moins de 15 minutes à un opérateur formé, sans lecteur de codes-barres ; ajouter un article au ticket prend moins de 5 secondes au clavier seul. [Q3]
- Une démonstration hors boutique : au moins une famille d'articles du registre papier est saisie de bout en bout (clavier et/ou import) et utilisable à la caisse. [Q3]
- Un point de démonstration a lieu à la fin de U4, hors boutique, avant de passer à l'unité suivante. [Q7]

## Déclencheur de l'initiative

- Le socle u1–u3 est prêt : sans interface catalogue, on ne peut pas enchaîner une caisse réelle ni les unités suivantes qui en dépendent. [Q4]
- Pression métier : le registre papier doit entrer dans le système avant toute installation en boutique. [Q4]

## Premier signal de périmètre

**Plan de travail retenu** (workflow-selected) : `spec-driven-dual-target-ops`. [scope]

**Périmètre produit confirmé** :

- Conserver ce plan de travail pour construire U4. [Q8]
- Tout le catalogue visé par les exigences FR3.1 à FR3.8 entre dans **cette** intention : fiche, recherche, import de fichier sans mouvement de stock, saisie clavier rapide, désactivation et étiquette, **et** saisie par photo du registre. [Q9] [desc]
- Une preuve de concept de reconnaissance de texte (photo du registre) est incluse dans U4 ; le moyen (sur l'appareil ou service tiers) est tranché **avant** de figer l'adaptateur. [Q10]
- Si un service tiers est retenu, les prix d'achat ne lui sont jamais transmis — déjà tranché par les exigences, non rouvert ici. [Q10] [Q9]

**Décision de périmètre et d'ordre** :

- Le développeur décide de l'ordre de construction et du découpage technique. [Q6]
- Le propriétaire tranche le métier (ce qui doit être utilisable) quand un arbitrage remonte. [Q6]

**Frontière à ne pas élargir dans cette intention** : l'interface catalogue est embarquée dans la caisse et s'appuie sur le socle déjà livré ; ce n'est pas une nouvelle application propriétaire. [desc]

## Assumptions & Open Questions

None.

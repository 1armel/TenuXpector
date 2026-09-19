# Découpage en unités — Questions

Cette étape découpe le travail en unités et déclare leurs dépendances. Elle ne décide pas de l'ordre de construction : c'est le sujet de l'étape suivante. Ton document nomme déjà des unités U0 à U8 et U10 ; ces questions portent sur ce qu'il faut en faire.

## Q1. Quelle frontière pour les unités ?

Contexte : deux découpages coexistent. Ton document raisonne par unité fonctionnelle (socle, domaine, catalogue, caisse…). La conception du domaine vient de produire 17 composants techniques. Les unités de travail peuvent suivre l'un ou l'autre.

A. Garder les unités de ton document — preuve de concept, socle, domaine, catalogue, caisse, impression, audit et alertes, synchronisation, approvisionnement, crédit, facturation — chacune regroupant les composants qu'elle a besoin de construire
B. Une unité par composant du domaine : 17 unités fines, chacune livrable et testable seule
C. Des unités plus grosses : socle, cœur métier, caisse complète, contrôle et suivi, activités ajoutées
D. Un découpage mixte, à détailler
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Comment traiter les deux cibles et les applications séparées ?

Contexte : la V1 tourne sur PC (Electron) **et** sur tablette Android (Capacitor), avec parité vérifiée. Il existe aussi une application propriétaire séparée de la caisse, et un serveur de synchronisation. Ces éléments peuvent être des unités à part entière, ou faire partie des unités fonctionnelles.

A. Trois unités dédiées en plus : l'empaquetage PC, l'empaquetage tablette, et l'application du propriétaire ; le serveur de synchronisation reste dans l'unité de synchronisation
B. Comme A, mais le serveur de synchronisation devient aussi une unité à part
C. Aucune unité dédiée : chaque unité fonctionnelle livre ses deux cibles et sa part d'interface
D. Une seule unité d'empaquetage pour les deux cibles, plus l'application du propriétaire
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q3. Les unités indépendantes peuvent-elles avancer en parallèle ?

Contexte : tu construis seul, mais le graphe de dépendances peut autoriser plusieurs chemins. Cela ne fixe pas l'ordre — seulement ce qui est permis.

A. Le graphe autorise le parallélisme entre unités indépendantes ; à l'étape suivante de choisir un ordre, en gardant la liberté de changer d'avis
B. Chaîne strictement séquentielle : chaque unité dépend de la précédente, sans alternative
C. Parallélisme autorisé, mais limité à deux unités à la fois
D. Pas encore défini
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses et du découpage que je vais produire :

- **Frontière** : les unités sont celles de ton document — preuve de concept, socle, domaine, catalogue, caisse, impression, audit et alertes, synchronisation, approvisionnement, crédit, facturation — chacune regroupant les composants qu'elle construit (Q1).
- **Cibles et applications** : trois unités dédiées en plus — empaquetage PC, empaquetage tablette, application du propriétaire. Le serveur de synchronisation reste dans l'unité de synchronisation (Q2).
- **Parallélisme** : le graphe autorise plusieurs chemins entre unités indépendantes ; l'ordre sera choisi à l'étape suivante (Q3).
- **Total** : 14 unités, chacune avec son identifiant, son dossier de construction, sa nature (service, interface, bibliothèque, empaquetage), sa taille relative et ses dépendances.
- **Traçabilité** : les 82 exigences sont rattachées à leur unité, sans trou.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

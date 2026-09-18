# Conception du domaine — Questions

Le découpage en paquets est déjà fixé par tes exigences (EF-U0-01) et par les pratiques affirmées : `domain` pur, `sync` pour l'outbox et les transports, `db`, `shared`, et les applications caisse, propriétaire et API. Ces questions ne portent que sur ce que ce découpage ne tranche pas.

## Q1. Comment découper l'intérieur du paquet `domain` ?

Contexte : `domain` contient toutes les fonctions pures — stock, coût moyen, tarification, totaux, espèces, alertes, rapport, et maintenant crédit et réception. C'est le cœur du produit, testé à 90 %. Le découpage interne décide de ce qu'on peut modifier sans toucher au reste.

A. Un composant par domaine métier : Stock, Pricing, Sale, CashSession, Alerting, Reporting, Credit, Procurement — chacun avec ses règles et ses entités
B. Deux composants seulement : Calculs (stock, prix, totaux) et Contrôle (alertes, rapport, écarts)
C. Un seul composant `domain`, découpé en simples fichiers sans frontière déclarée
D. Découpage par unité de travail : un composant par unité U1 à U8
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Où vit la règle « le vendeur ne voit jamais le prix d'achat, le CUMP ni la marge » ?

Contexte : c'est un invariant de sécurité, appliqué à deux endroits selon DEC-01 — la couche de lecture de la caisse et l'API. La question est de savoir si c'est un composant à part entière, ou une responsabilité répartie.

A. Un composant dédié, traversé par toute lecture de données sensibles, côté caisse comme côté API : une seule implémentation, testée une fois
B. Une responsabilité de chaque composant qui expose des données : chacun filtre selon le rôle reçu
C. Une responsabilité de la couche de lecture de l'application caisse et de l'API, hors du domaine
D. Pas encore défini
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q3. Comment l'écriture d'une vente et de son événement de synchronisation reste-t-elle atomique ?

Contexte : l'invariant impose qu'une mutation et son événement `outbox` soient écrits dans la même transaction (EF-U3-15, EF-U6-01). Cela décide quel composant possède l'écriture.

A. Un composant d'écriture transactionnelle possède la transaction : il reçoit le résultat calculé par le domaine, écrit la donnée et l'événement ensemble, et refuse toute écriture partielle
B. Chaque composant métier écrit ses propres données et son événement, en ouvrant lui-même sa transaction
C. Le paquet `sync` possède la transaction et appelle les composants métier
D. Pas encore défini
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses :

- **Découpage du domaine** : un composant par domaine métier — Stock, Pricing, Sale, CashSession, Alerting, Reporting, Credit, Procurement — chacun avec ses règles et ses entités (Q1).
- **Masquage des données sensibles** : un composant dédié, traversé par toute lecture de prix d'achat, de coût moyen ou de marge, utilisé côté caisse comme côté API — une seule implémentation, testée une fois (Q2).
- **Atomicité** : un composant d'écriture transactionnelle possède la transaction. Il reçoit le résultat calculé par le domaine, écrit la donnée métier et son événement de synchronisation ensemble, et refuse toute écriture partielle (Q3).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

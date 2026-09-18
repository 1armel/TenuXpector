# Décisions d'architecture — Conception du domaine

Journal des décisions prises à la conception du domaine. Entrées : `requirements.md`, `domain-design-questions.md`, `team-practices.md`, `docs/exigences-tenuxpector.md`.

Ces ADR complètent ceux qui seront écrits dans `docs/adr/` pendant le socle (U0), où les décisions DEC-01 à DEC-14 du document d'exigences sont reprises.

## ADR-001 : Découper le domaine par domaine métier

**Contexte.** `packages/domain` concentre toutes les fonctions pures et doit tenir une couverture d'au moins 90 % des lignes et des branches. Trois découpages étaient viables : par domaine métier, par couche de responsabilité (calculs contre contrôle), ou un bloc unique sans frontière déclarée. Un quatrième, par unité de travail U1 à U8, a aussi été envisagé.

**Décision.** Un composant par domaine métier : StockLedger, Costing, Catalog, Pricing, SaleCalculator, CashSession, Credit, Procurement, AlertEngine, Reporting, Settings, Identity. Chacun possède ses règles et ses entités.

**Conséquences.**
- Positif : chaque composant se teste isolément, ce qui rend la couverture de 90 % atteignable sans tests d'intégration lourds. Les règles d'argent restent séparées des règles d'affichage. Ajouter le crédit ou l'approvisionnement n'a pas alourdi la vente.
- Négatif : plus de frontières à tenir, donc plus de code d'assemblage. Une règle qui traverse deux composants — par exemple une vente à crédit — se lit à deux endroits.
- Neutre : le découpage ne dit rien du déploiement, qui reste à décider au découpage en unités.

**Alternatives rejetées.**
- *Deux composants seulement (calculs et contrôle)* : frontière trop grossière ; le stock, les prix et les espèces auraient partagé un même module, alors qu'ils changent pour des raisons différentes.
- *Un bloc unique* : plus simple au départ, mais aucune frontière testable et un risque réel de mélanger les calculs d'argent avec la présentation.
- *Un composant par unité de travail* : ferait dépendre la structure du code d'un calendrier de livraison plutôt que du métier ; les unités disparaissent une fois livrées, les domaines restent.

## ADR-002 : Un composant unique pour le masquage des données sensibles

**Contexte.** Un vendeur ne doit jamais voir le prix d'achat, le coût moyen, la marge, le chiffre d'affaires cumulé ni la valorisation. La décision DEC-01 impose d'appliquer ce filtrage à deux endroits : la couche de lecture de la caisse et l'API. Deux implémentations, c'est deux occasions de se tromper.

**Décision.** Un composant `SensitiveDataGuard` détient la règle. Toute lecture de donnée sensible le traverse, côté caisse comme côté API. Il reçoit le rôle de l'utilisateur et retire les champs interdits.

**Conséquences.**
- Positif : une seule implémentation, testée une fois ; une faille corrigée l'est partout. La règle devient lisible en un seul endroit lors d'un audit.
- Négatif : un point de passage obligé sur tous les chemins de lecture, donc un risque de contournement par oubli. À contrer par une règle de lint qui interdit d'exposer les champs sensibles sans passer par lui.
- Neutre : le composant dépend de `Identity` pour connaître le rôle courant.

**Alternatives rejetées.**
- *Filtrage réparti dans chaque composant* : multiplie les implémentations d'un invariant de sécurité, et rend impossible de prouver la règle en un test.
- *Filtrage uniquement dans les applications, hors du domaine* : laisse l'API et la caisse diverger, exactement ce que DEC-01 cherche à éviter.

## ADR-003 : Un propriétaire unique de la transaction

**Contexte.** L'invariant le plus coûteux à défaire impose qu'une mutation métier et son événement de synchronisation soient écrits dans la même transaction, avec l'audit. Une vente doit exister entièrement ou pas du tout, même si le courant tombe au milieu.

**Décision.** Un composant `TransactionalWriter` possède la transaction locale. Il reçoit un résultat déjà calculé par le domaine et écrit ensemble la donnée métier, les mouvements, l'audit et les événements de synchronisation. Toute écriture partielle est refusée.

**Conséquences.**
- Positif : l'atomicité se teste en un seul endroit, y compris par arrêt forcé. Les composants métier restent purs et ignorent la base. La règle « pas d'opération sans session ouverte » et le filtrage par tenant s'appliquent au même point de passage.
- Négatif : ce composant devient un goulot de connaissance : il doit savoir écrire toutes les formes de résultat. Sa taille est à surveiller.
- Neutre : il est le seul à dépendre de la base locale chiffrée.

**Alternatives rejetées.**
- *Chaque composant ouvre sa transaction* : deux composants pourraient écrire en deux transactions et laisser un état partiel ; l'invariant deviendrait une convention plutôt qu'une garantie.
- *Le paquet de synchronisation possède la transaction* : inverserait la dépendance, puisque le métier ne doit jamais dépendre de la synchronisation, laquelle est optionnelle par conception.

## ADR-004 : Isoler la saisie du catalogue par photo

**Contexte.** La saisie initiale par photo du registre dépend d'un moyen de reconnaissance de texte qui n'est pas encore choisi — sur l'appareil ou service tiers, tranché à la preuve de concept. Si un service tiers est retenu, aucun prix d'achat ne doit lui être transmis.

**Décision.** Un composant `CatalogCapture` porte ce chemin, séparé de `Catalog`. Il pilote l'extraction et l'écran de vérification, et ne crée des articles qu'après validation humaine. Il ne crée jamais de quantité de stock.

**Conséquences.**
- Positif : le choix du moyen de reconnaissance reste réversible et ne contamine pas le catalogue. La saisie clavier rapide reste un chemin complet et indépendant.
- Négatif : un composant de plus pour un usage ponctuel, essentiellement à l'installation.
- Neutre : son unique dépendance externe est le moyen de reconnaissance, à documenter par un ADR une fois choisi.

**Alternatives rejetées.**
- *Intégrer la capture dans `Catalog`* : lierait le catalogue à un service externe non choisi, et ferait dépendre une brique centrale d'une décision réversible.

## ADR-005 : Le graphe des dépendances reste acyclique

**Contexte.** `SaleCalculator` consulte `Credit` pour autoriser un paiement à crédit, et `Credit` a besoin des ventes pour calculer un solde. La lecture naïve crée un cycle.

**Décision.** Le cycle est évité par le sens de la dépendance : `Credit` ne lit pas les ventes, il détient ses propres mouvements de compte client, alimentés par `TransactionalWriter` au moment de l'écriture. `SaleCalculator` ne fait que demander une autorisation à `Credit`. Ce lien est déclaré dans le catalogue — `TransactionalWriter` dépend de `Credit`, et `Credit` liste `TransactionalWriter` parmi ses appelants — pour que le mécanisme soit vérifiable et pas seulement affirmé ici.

**Conséquences.**
- Positif : graphe acyclique, chaque composant testable seul ; le solde d'un client est une somme de mouvements, cohérente avec les journaux à ajout seul.
- Négatif : le lien entre une vente et son mouvement de compte est porté par une référence, pas par une lecture directe ; il faut le vérifier par un test.
- Neutre : même schéma que pour le stock, où `StockLedger` détient les mouvements produits par la vente.

**Alternatives rejetées.**
- *`Credit` lit les ventes pour calculer le solde* : introduirait un cycle et ferait dépendre le crédit de la forme d'une vente.

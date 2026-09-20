# Conception fonctionnelle — U3 Domaine (`u3-domain`) — Questions

Unité : fonctions **pures** de calcul — stock/mouvements, CUMP, conversion d'unités, tarification/plancher, totaux/marges, paiements/rendu, espèces théoriques/écart, alertes, rapport. Composants : StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting. Aucune base, UI, ni réseau. Couverture ≥ 90 % lignes et branches. Correspondance document : U1.

## Interaction Mode

Comment souhaitez-vous répondre aux questions de cette unité ?

- A. Guide me — une question à la fois
- B. I'll edit the file — je remplis le fichier moi-même
- C. Chat — on discute librement, vous consolidez ensuite

[Answer]: A

## Q1 — Représentation des nombres (DEC-04)

Confirme-t-on les unités entières exclusives dans `packages/domain` ?

- A. Oui : montants FCFA entiers ; quantités en millièmes d'unité de base ; CUMP en millièmes de FCFA ; taux en points de base — aucun flottant
- B. Autre représentation (préciser)
- X. Other (please specify)

[Answer]:

## Q2 — Quantité en stock (RG-10)

Comment calcule-t-on la quantité d'un article ?

- A. Somme signée des mouvements uniquement ; jamais de champ quantité mutable ; état reconstituable à une date
- B. Autre (préciser)
- X. Other (please specify)

[Answer]:

## Q3 — Stock négatif (DEC-03)

Une vente avec stock théorique insuffisant ?

- A. Jamais bloquée ; stock peut devenir négatif ; alerte AL-09 côté moteur d'alertes
- B. Bloquer la vente si stock insuffisant
- X. Other (please specify)

[Answer]:

## Q4 — CUMP (RG-11)

Recalcul du coût unitaire moyen pondéré ?

- A. À chaque entrée (réception/ajustement), y compris stock nul ou négatif ; toujours positif (propriétés testées)
- B. Autre formule (préciser)
- X. Other (please specify)

[Answer]:

## Q5 — Emprise des composants U3

Quels composants livrer dans cette unité (tous purs) ?

- A. Les sept : StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting — comme `unit-of-work.md`
- B. Sous-ensemble (préciser lesquels et pourquoi)
- X. Other (please specify)

[Answer]:

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

[Answer]: A

## Q2 — Quantité en stock (RG-10)

Comment calcule-t-on la quantité d'un article ?

- A. Somme signée des mouvements uniquement ; jamais de champ quantité mutable ; état reconstituable à une date
- B. Autre (préciser)
- X. Other (please specify)

[Answer]: A

## Q3 — Stock négatif (DEC-03)

Une vente avec stock théorique insuffisant ?

- A. Jamais bloquée ; stock peut devenir négatif ; alerte AL-09 côté moteur d'alertes
- B. Bloquer la vente si stock insuffisant
- X. Other (please specify)

[Answer]: A

## Q4 — CUMP (RG-11)

Recalcul du coût unitaire moyen pondéré ?

- A. À chaque entrée (réception/ajustement), y compris stock nul ou négatif ; toujours positif (propriétés testées)
- B. Autre formule (préciser)
- X. Other (please specify)

[Answer]: A

## Q5 — Emprise des composants U3

Quels composants livrer dans cette unité (tous purs) ?

- A. Les sept : StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting — comme `unit-of-work.md`
- B. Sous-ensemble (préciser lesquels et pourquoi)
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses :

- **Nombres** : entiers exclusifs (FCFA, millièmes qty, millièmes CUMP, points de base) — aucun flottant dans `domain` (Q1-A / DEC-04).
- **Quantité** : somme signée des mouvements ; pas de champ quantité mutable ; état à une date (Q2-A / RG-10).
- **Stock négatif** : vente jamais bloquée ; négatif possible ; AL-09 (Q3-A / DEC-03).
- **CUMP** : recalcul à chaque entrée, y compris stock ≤ 0 ; reste ≥ 0 (Q4-A / RG-11).
- **Emprise** : les 7 composants purs — StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting (Q5-A).
- **Hors scope** : base, UI, réseau ; couverture ≥ 90 % lignes et branches.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

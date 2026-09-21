# Règles métier — U3 Domaine (`u3-domain`)

> Résumé consolidé confirmé (`Looks correct`).

```yaml
rules:
  - id: BR1.1
    statement: Montants, quantités, CUMP et taux sont des entiers exclusifs (FCFA, millièmes, millièmes de FCFA, points de base) ; aucun flottant dans domain
    category: constraint
    applies_to: [MoneyFcfa, QuantityBase, Cump, RateBp]
    trigger: toute opération de calcul
    logic: IF une grandeur monétaire, de quantité, de CUMP ou de taux est manipulée THEN elle est un entier à l'échelle DEC-04
    violation: refus / erreur de type côté domaine
    source: FR2.1, FR2.3, DEC-04

  - id: BR1.2
    statement: Une seule fonction d'arrondi entier (plus proche, demi vers le haut) sert tous les calculs ; l'arrondi espèces ne touche jamais total_ttc, ligne, CUMP ni marge
    category: calculation
    applies_to: [MoneyFcfa, SaleTotals, PaymentPlan, Cump]
    trigger: division ou arrondi
    logic: IF arrondi nécessaire THEN arrondir(num, den) ; IF encaissement espèces THEN arrondir au multiple cashRoundingUnit uniquement sur le montant espèces
    violation: calcul invalide
    source: FR2.5, RG-01

  - id: BR2.1
    statement: quantiteStock = somme des quantite_base signées des mouvements de l'article pour le magasin ; jamais de champ quantité mutable
    category: calculation
    applies_to: [StockMovementView, QuantityBase]
    trigger: demande de quantité
    logic: IF quantiteStock(mouvements) THEN retourner Σ quantityBase.milliUnits
    violation: N/A (fonction pure)
    source: FR2.1, RG-10

  - id: BR2.2
    statement: etatStockAu ne tient compte que des mouvements dont operationDate ≤ date demandée
    category: calculation
    applies_to: [StockMovementView]
    trigger: reconstitution historique
    logic: IF etatStockAu(mouvements, date) THEN filtrer operationDate ≤ date puis appliquer BR2.1
    violation: N/A
    source: FR2.1, EF-U1-02

  - id: BR2.3
    statement: Une vente n'est jamais bloquée pour stock insuffisant ; le stock théorique peut devenir négatif
    category: policy
    applies_to: [StockMovementView, QuantityBase]
    trigger: calcul post-vente ou évaluation stock
    logic: IF une sortie ferait Q < 0 THEN autoriser le résultat négatif (blocage UI hors domaine)
    violation: N/A côté domaine (pas de refus)
    source: FR2.1, DEC-03

  - id: BR2.4
    statement: Conversion unité de vente ↔ unité de base sans flottant via factorToBaseMilli
    category: calculation
    applies_to: [SellingUnitView, QuantityBase]
    trigger: saisie ou sortie en unité de vente
    logic: IF versUniteBase(q, unit) THEN milli = arrondir(q × factor, échelle) ; inverse symétrique
    violation: facteur invalide (< 1) → erreur
    source: FR2.3

  - id: BR2.5
    statement: La quantité en stock est indépendante de l'ordre d'insertion des mouvements (somme commutative)
    category: constraint
    applies_to: [StockMovementView, QuantityBase]
    trigger: suite de mouvements / tests de propriétés
    logic: IF deux permutations des mêmes mouvements THEN quantiteStock identique
    violation: échec de test de propriété
    source: FR2.10, EF-U1-11

  - id: BR3.1
    statement: CUMP recalculé à chaque entrée q > 0 au coût c ; si Q_avant ≤ 0 alors cump = c ; sinon moyenne pondérée arrondie ; sorties ne changent pas le CUMP
    category: calculation
    applies_to: [Cump, StockMovementView]
    trigger: entrée de stock
    logic: IF entrée q>0 au coût c AND Q_avant≤0 THEN cump=c ; ELSE cump=arrondir(Q_avant×cump_avant + q×c, Q_avant+q) ; IF sortie THEN cump inchangé
    violation: N/A
    source: FR2.2, RG-11

  - id: BR3.2
    statement: Après toute suite de mouvements, le CUMP reste ≥ 0 ; un mouvement suivi de son inverse restaure la quantité initiale
    category: constraint
    applies_to: [Cump, QuantityBase]
    trigger: recalcul / suite aléatoire
    logic: IF recalcul CUMP THEN résultat ≥ 0 ; IF mouvement puis inverse THEN quantité restaurée (CUMP rejoué selon historique ordonné)
    violation: échec de test de propriété
    source: FR2.10, EF-U1-11

  - id: BR3.3
    statement: Valeur du stock = arrondir(Q × cump, 1_000_000)
    category: calculation
    applies_to: [QuantityBase, Cump, MoneyFcfa]
    trigger: valorisation
    logic: IF valoriser(Q, cump) THEN MoneyFcfa = arrondir(Q × cump, 1_000_000)
    violation: N/A
    source: FR2.2, RG-12

  - id: BR4.1
    statement: Remise de ligne = max(0, prix_reference − prix_applique) × quantite_vente
    category: calculation
    applies_to: [PricedLine]
    trigger: tarification ligne
    logic: IF calculer remises THEN lineDiscount selon RG-02
    violation: N/A
    source: FR2.4, RG-02

  - id: BR4.2
    statement: Sous plancher si prix_applique < prix_plancher ; écart en points de base selon RG-03
    category: calculation
    applies_to: [PricedLine]
    trigger: tarification ligne
    logic: IF applied < floor THEN underFloor=true AND floorGapBp = floor((floor−applied)×10000/floor)
    violation: N/A
    source: FR2.4, RG-03

  - id: BR5.1
    statement: Totaux ticket TTC/HT/TVA/remise selon RG-04 ; HT ventilé au prorata, dernière ligne absorbe le reste ; chaque ligne porte lineAmountTtc
    category: calculation
    applies_to: [SaleTotals, PricedLine, DomainParameters]
    trigger: totaux ticket
    logic: IF tva.applicable THEN total_ht=arrondir(total_ttc×10000, 10000+taux_pb) ; ELSE total_ht=total_ttc ; Σ ht_ligne = total_ht exact ; lineAmountTtc par ligne
    violation: incohérence des totaux → erreur
    source: FR2.5, RG-04

  - id: BR5.2
    statement: cout_ligne = arrondir(|quantite_base| × cump, 1_000_000) ; marge_ligne = ht_ligne − cout_ligne (peut être négative)
    category: calculation
    applies_to: [SaleTotals, Cump, QuantityBase]
    trigger: marge
    logic: IF calculer marge THEN appliquer RG-05
    violation: N/A
    source: FR2.5, RG-05

  - id: BR5.3
    statement: Σ paiements (tous modes, credit inclus) ≥ total_ttc ; changeDue = Σ_tous_modes − total_ttc ; changeDue ≤ Σ espèces sinon refus ; especes_nettes = especes − changeDue. Le crédit couvre le total mais n'alimente pas le plafond du rendu (plafond crédit vérifié hors U3 / U10)
    category: validation
    applies_to: [PaymentPlan, PaymentItem, SaleTotals]
    trigger: plan de paiement
    logic: IF Σ amount(tous modes) < total_ttc OR (Σ amount − total_ttc) > Σ amount(mode=especes) THEN rejeter ; credit compte dans la couverture du total mais pas dans le plafond du rendu ; ELSE changeDue = Σ − total_ttc ; netCash = especes − changeDue
    violation: plan de paiement refusé
    source: FR2.6, RG-06, EF-U8-03

  - id: BR6.1
    statement: Espèces théoriques = fond_initial + Σ especes_nettes + entrées − sorties − remboursements espèces de la session
    category: calculation
    applies_to: [SessionCashPosition]
    trigger: clôture ou position session
    logic: IF theoriques(session) THEN appliquer RG-20
    violation: N/A
    source: FR2.7, RG-20

  - id: BR6.2
    statement: ecart = especes_comptees − theoriques ; montant_verse = especes_comptees − fond_laisse avec 0 ≤ fond_laisse ≤ especes_comptees
    category: calculation
    applies_to: [SessionCashPosition]
    trigger: clôture
    logic: IF écart/versement THEN appliquer RG-21
    violation: fond_laisse hors bornes → refus
    source: FR2.7, RG-21

  - id: BR7.1
    statement: evaluerAlertes(DomainEvent, AlertContext, DomainParameters) et evaluerAlertesPeriodiques(AlertHistory, DomainParameters) sont pures et retournent Alert[]
    category: policy
    applies_to: [Alert, DomainEvent, AlertContext, AlertHistory, DomainParameters]
    trigger: événement métier ou clôture/démarrage
    logic: IF règle AL-xx applicable THEN émettre Alert avec code, sévérité, valeurs et snapshot paramètres
    violation: N/A
    source: FR2.8

  - id: BR7.2
    statement: Stock théorique négatif déclenche AL-09 (basse) ; la vente n'est pas bloquée
    category: policy
    applies_to: [Alert, QuantityBase]
    trigger: après mouvement ou évaluation stock
    logic: IF quantiteStock < 0 THEN inclure AL-09 dans le résultat
    violation: N/A
    source: FR2.8, DEC-03, AL-09

  - id: BR7.3
    statement: Taux pour 100 tickets selon RG-30 ; non calculé si échantillon < alertThresholds.echantillonMin
    category: calculation
    applies_to: [DailyReport, Alert, AlertThresholds]
    trigger: statistiques opérateur / AL-07
    logic: IF nb_tickets < echantillonMin THEN « échantillon insuffisant » ELSE taux = nb_events×100/nb_tickets
    violation: N/A
    source: FR2.8, FR2.9, RG-30

  - id: BR8.1
    statement: rapportJournalier(donneesDuJour) produit un DailyReport avec le contenu du rapport quotidien (cadrage)
    category: calculation
    applies_to: [DailyReport]
    trigger: demande de rapport
    logic: IF rapportJournalier THEN agréger tickets, caisses, écarts, alertes du jour sans I/O
    violation: N/A
    source: FR2.9

  - id: BR9.1
    statement: Aucune dépendance domaine → base, UI ou réseau ; couverture tests ≥ 90 % lignes et branches
    category: constraint
    applies_to: [all_entities]
    trigger: conception / CI
    logic: IF paquet domain THEN imports limités aux types purs ; tests d'abord
    violation: dépendance interdite ou couverture insuffisante
    source: FR2.10, unit-of-work U3
```

## Synthèse des règles

| Groupe | IDs | Intent |
|---|---|---|
| Représentation / arrondi | BR1.1–BR1.2 | DEC-04, RG-01 |
| Stock | BR2.1–BR2.5 | RG-10, DEC-03, conversions, ordre |
| CUMP | BR3.1–BR3.3 | RG-11, RG-12, propriétés |
| Tarification | BR4.1–BR4.2 | RG-02, RG-03 |
| Ticket / paiements | BR5.1–BR5.3 | RG-04, RG-05, RG-06 |
| Caisse session | BR6.1–BR6.2 | RG-20, RG-21 |
| Alertes | BR7.1–BR7.3 | AL-xx, RG-30 |
| Rapport / pureté | BR8.1, BR9.1 | EF-U1-10, frontière U3 |

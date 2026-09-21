# Entités — U3 Domaine (`u3-domain`)

> Résumé consolidé confirmé (`Looks correct`).

Décisions Q&A : entiers exclusifs DEC-04 (Q1-A) ; quantité = somme des mouvements (Q2-A) ; stock négatif autorisé + AL-09 (Q3-A) ; CUMP à chaque entrée y compris Q ≤ 0 (Q4-A) ; sept composants purs (Q5-A).

Ces entités sont des **valeurs de calcul** (entrées/sorties des fonctions pures). Aucune persistance, aucune dépendance base/UI/réseau dans cette unité. Les tables append-only (mouvements, ventes…) appartiennent à U2/U5 ; le domaine les reçoit comme structures immuables.

```yaml
entities:
  - name: MoneyFcfa
    description: Montant monétaire en FCFA entiers (XAF sans subdivision)
    attributes:
      - { name: amount, logical_type: integer, required: true, min: null }
    constraints:
      - Jamais de flottant ; signe autorisé seulement quand la règle le prévoit (écart, marge)
    relationships: []

  - name: QuantityBase
    description: Quantité en millièmes d'unité de base (1 pièce = 1000)
    attributes:
      - { name: milliUnits, logical_type: integer, required: true }
    constraints:
      - Jamais de flottant ; signe = sens du mouvement
    relationships: []

  - name: Cump
    description: Coût unitaire moyen pondéré en millièmes de FCFA par unité de base
    attributes:
      - { name: milliFcfaPerBase, logical_type: integer, required: true, min: 0 }
    constraints:
      - Toujours ≥ 0 après tout recalcul (EF-U1-11)
    relationships: []

  - name: RateBp
    description: Taux en points de base (19,25 % = 1925)
    attributes:
      - { name: basisPoints, logical_type: integer, required: true, min: 0 }
    constraints:
      - Affichage « virgule » hors domaine ; stockage entier uniquement
    relationships: []

  - name: StockMovementView
    description: Vue immuable d'un mouvement de stock pour les calculs
    attributes:
      - { name: productId, logical_type: uuid_v7, required: true }
      - { name: storeId, logical_type: uuid_v7, required: true }
      - { name: quantityBase, logical_type: QuantityBase, required: true }
      - { name: unitCostMilli, logical_type: integer, required: false, min: 0 }
      - { name: operationDate, logical_type: date, required: true }
      - { name: kind, logical_type: enum, required: true, allowed: [ENTREE_ACHAT, ENTREE_INVENTAIRE, AJUSTEMENT_INVENTAIRE, SORTIE_VENTE, SORTIE_CASSE, SORTIE_PERTE, SORTIE_USAGE_INTERNE, RETOUR_ANNULATION] }
    constraints:
      - Entrée pour StockLedger/Costing ; jamais mutée par le domaine
    relationships:
      - { to: QuantityBase, cardinality: many_to_one, direction: StockMovementView->QuantityBase }

  - name: SellingUnitView
    description: Facteur de conversion unité de vente → unité de base
    attributes:
      - { name: productId, logical_type: uuid_v7, required: true }
      - { name: label, logical_type: text, required: true }
      - { name: factorToBaseMilli, logical_type: integer, required: true, min: 1 }
    constraints:
      - Conversion sans flottant (FR2.3)
    relationships: []

  - name: PricedLine
    description: Résultat de tarification d'une ligne (Pricing)
    attributes:
      - { name: referencePrice, logical_type: MoneyFcfa, required: true }
      - { name: appliedPrice, logical_type: MoneyFcfa, required: true }
      - { name: floorPrice, logical_type: MoneyFcfa, required: true }
      - { name: saleQuantityMilli, logical_type: integer, required: true, min: 1 }
      - { name: lineDiscount, logical_type: MoneyFcfa, required: true }
      - { name: underFloor, logical_type: boolean, required: true }
      - { name: floorGapBp, logical_type: integer, required: true, min: 0 }
      - { name: lineAmountTtc, logical_type: MoneyFcfa, required: true }
      - { name: lineAmountHt, logical_type: MoneyFcfa, required: false }
    constraints:
      - lineAmountTtc = arrondir(appliedPrice × saleQuantityMilli, 1000) (RG-04)
    relationships: []

  - name: PaymentItem
    description: Un paiement d'un plan (mode + montant)
    attributes:
      - { name: amount, logical_type: MoneyFcfa, required: true, min: 1 }
      - { name: mode, logical_type: enum, required: true, allowed: [especes, camtel, mtn_momo, orange_money, virement, credit] }
      - { name: reference, logical_type: text, required: false }
    constraints:
      - reference obligatoire si mode ∈ {camtel, mtn_momo, orange_money} (vérif UI/U5 ; domaine peut l'exiger)
      - mode credit : hors plafond U10 ; compte dans Σ pour couvrir total_ttc ; n'entre pas dans le plafond du rendu (espèces seules)
    relationships: []

  - name: SaleTotals
    description: Totaux TTC/HT/TVA/remise/marge d'un ticket (SaleCalculator)
    attributes:
      - { name: totalTtc, logical_type: MoneyFcfa, required: true }
      - { name: totalHt, logical_type: MoneyFcfa, required: true }
      - { name: vatAmount, logical_type: MoneyFcfa, required: true }
      - { name: totalDiscount, logical_type: MoneyFcfa, required: true }
      - { name: totalMargin, logical_type: MoneyFcfa, required: true }
      - { name: cashRoundingDelta, logical_type: MoneyFcfa, required: true }
    constraints:
      - Si TVA non applicable : totalHt = totalTtc et vatAmount = 0
      - Σ ht_ligne = totalHt exactement (dernière ligne absorbe le reste)
    relationships: []

  - name: PaymentPlan
    description: Ensemble de paiements et rendu calculés
    attributes:
      - { name: payments, logical_type: PaymentItem_list, required: true }
      - { name: totalPaid, logical_type: MoneyFcfa, required: true }
      - { name: changeDue, logical_type: MoneyFcfa, required: true, min: 0 }
      - { name: netCash, logical_type: MoneyFcfa, required: true }
    constraints:
      - Σ amount(paiements) ≥ totalTtc ; rendu ≤ Σ amount(mode=especes)
      - Modes credit exclus du calcul du rendu (EF-U8-03)
    relationships:
      - { to: PaymentItem, cardinality: one_to_many, direction: PaymentPlan->PaymentItem }

  - name: SessionCashPosition
    description: Espèces théoriques et écart d'une session (CashSession)
    attributes:
      - { name: theoreticalCash, logical_type: MoneyFcfa, required: true }
      - { name: countedCash, logical_type: MoneyFcfa, required: true }
      - { name: variance, logical_type: MoneyFcfa, required: true }
      - { name: amountToDeposit, logical_type: MoneyFcfa, required: true, min: 0 }
      - { name: floatLeft, logical_type: MoneyFcfa, required: true, min: 0 }
    constraints:
      - 0 ≤ floatLeft ≤ countedCash ; variance = counted − theoretical
    relationships: []

  - name: Alert
    description: Alerte émise par AlertEngine (canal de notification hors unité)
    attributes:
      - { name: code, logical_type: text, required: true }
      - { name: severity, logical_type: enum, required: true, allowed: [haute, moyenne, basse] }
      - { name: operatorId, logical_type: uuid_v7, required: false }
      - { name: sessionId, logical_type: uuid_v7, required: false }
      - { name: relatedEntityId, logical_type: uuid_v7, required: false }
      - { name: triggerValues, logical_type: structured_value, required: true }
      - { name: parameterSnapshot, logical_type: structured_value, required: true }
    constraints:
      - Chaque alerte porte les valeurs déclenchantes et le paramètre au moment du déclenchement
    relationships: []

  - name: DailyReport
    description: Rapport de clôture journalier (Reporting)
    attributes:
      - { name: day, logical_type: date, required: true }
      - { name: ticketCount, logical_type: integer, required: true, min: 0 }
      - { name: salesTtc, logical_type: MoneyFcfa, required: true }
      - { name: cashVarianceSummary, logical_type: structured_value, required: true }
      - { name: alertsSummary, logical_type: structured_value, required: true }
      - { name: operatorRates, logical_type: structured_value, required: false }
    relationships: []

  - name: AlertThresholds
    description: Seuils d'alertes passés au domaine (clés §9 exigences)
    attributes:
      - { name: echantillonMin, logical_type: integer, required: true, min: 1, default: 50 }
      - { name: sousPlancherPb, logical_type: integer, required: true, min: 0, default: 1000 }
      - { name: facteurAtypique, logical_type: integer, required: true, min: 1, default: 3 }
      - { name: facteurSorties, logical_type: integer, required: true, min: 1, default: 2 }
      - { name: ecartMargePb, logical_type: integer, required: true, min: 0, default: 500 }
      - { name: ajustementValeur, logical_type: MoneyFcfa, required: true, default: 10000 }
      - { name: seuilEcartCaisse, logical_type: MoneyFcfa, required: true, default: 2000 }
      - { name: fenetreSessions, logical_type: integer, required: true, min: 1, default: 10 }
      - { name: nbManquantsMin, logical_type: integer, required: true, min: 1, default: 3 }
      - { name: cumulManquants, logical_type: MoneyFcfa, required: true, default: 5000 }
    relationships: []

  - name: DomainParameters
    description: Paramètres typés lus hors domaine et passés en entrée (jamais en dur)
    attributes:
      - { name: vatApplicable, logical_type: boolean, required: true }
      - { name: vatRateBp, logical_type: RateBp, required: false }
      - { name: cashRoundingUnit, logical_type: integer, required: true, min: 1 }
      - { name: alertThresholds, logical_type: AlertThresholds, required: true }
    constraints:
      - Toute valeur métier (TVA, seuils, arrondi espèces) vient de ce bundle
    relationships:
      - { to: AlertThresholds, cardinality: one_to_one, direction: DomainParameters->AlertThresholds }

  - name: DomainEvent
    description: Union discriminée des événements évalués par AlertEngine
    attributes:
      - { name: kind, logical_type: enum, required: true, allowed: [stock_changed, stock_adjusted, line_priced, sale_cancelled, session_opened, session_closed, session_force_closed, cash_outflow] }
      - { name: payload, logical_type: structured_value, required: true }
    constraints:
      - stock_changed → quantité résultante (AL-09, AL-16, AL-18)
      - stock_adjusted → valeur ajustement (AL-08)
      - line_priced → underFloor + floorGapBp (AL-05)
      - sale_cancelled → (AL-04)
      - session_opened → ecart_ouverture (AL-02)
      - session_closed → |ecart| (AL-01)
      - session_force_closed → (AL-03)
      - cash_outflow → alimente AlertHistory.recentSessions (AL-10 glissant ; pas d'émission directe)
    relationships: []

  - name: AlertContext
    description: État courant passé à evaluerAlertes
    attributes:
      - { name: operatorId, logical_type: uuid_v7, required: false }
      - { name: sessionId, logical_type: uuid_v7, required: false }
      - { name: storeId, logical_type: uuid_v7, required: true }
      - { name: currentQuantityBase, logical_type: integer, required: false }
      - { name: relatedEntityId, logical_type: uuid_v7, required: false }
      - { name: clockInstant, logical_type: instant, required: true }
    relationships: []

  - name: AlertHistory
    description: Agrégats pour règles glissantes (AL-06, AL-07, AL-10, AL-11)
    attributes:
      - { name: recentSessions, logical_type: structured_value, required: true }
      - { name: operatorTicketStats30d, logical_type: structured_value, required: true }
      - { name: peerOperatorMedians30d, logical_type: structured_value, required: false }
    constraints:
      - recentSessions porte écarts/manquants/sorties sur fenetreSessions
      - stats insuffisantes → pas d'alerte (échantillon)
    relationships: []
```

## Synthèse

| Entité | Rôle |
|---|---|
| MoneyFcfa, QuantityBase, Cump, RateBp | Unités DEC-04 |
| StockMovementView, SellingUnitView | Entrées StockLedger / Costing |
| PricedLine (+ lineAmountTtc), PaymentItem, SaleTotals, PaymentPlan | Pricing + SaleCalculator |
| SessionCashPosition | CashSession |
| Alert, DomainEvent, AlertContext, AlertHistory, AlertThresholds | AlertEngine |
| DailyReport | Reporting |
| DomainParameters | Entrée commune, zéro magie en dur |

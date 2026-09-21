## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-21T00:47:48Z
**Iteration:** 2

### Findings

> R-01 à R-07 proviennent des révisions antérieures (itérations f9b17f6359096183 et a2eb9adc958a6bd7/1). Statuts re-vérifiés sur les artefacts de la présente itération — aucune régression constatée.

| ID | Sévérité | Emplacement | Constat | Action requise | Statut |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/entities.md > entité PaymentPlan (attribut `payments`) ; entité DomainParameters (attribut `alertThresholds`) | `PaymentItem` est une entité à part entière ; `AlertThresholds` possède dix champs explicitement typés avec valeurs par défaut. BR5.3 et BR7.3 sont implémentables sans ambiguïté de type. | — | Resolved |
| R-02 | Major | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/functional-spec.md > WF6, étapes 1–2 ; entities.md | `DomainEvent`, `AlertContext` et `AlertHistory` sont définis avec leurs champs et contraintes. Le catalogue WF6 couvre les alertes événementielles (AL-01 à AL-05, AL-08, AL-09, AL-16, AL-18) et glissantes (AL-06, AL-07, AL-10, AL-11). Les signatures `evaluerAlertes` et `evaluerAlertesPeriodiques` sont implémentables. | — | Resolved |
| R-03 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/inception/units-generation/unit-of-work-story-map.md > ligne U5 | FR4.16 est rattaché à U5 dans la story-map ; `traceability.json` documente le report comme `GAP` avec justification UI. | — | Resolved |
| R-04 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/entities.md > entité PricedLine ; functional-spec.md > WF3 et WF4 | `lineAmountTtc: MoneyFcfa, required: true` avec contrainte RG-04 présent dans `PricedLine`. WF3 calcule et pose ce champ ; WF4 agrège. | — | Resolved |
| R-05 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/rules.md > BR3.2 et BR2.5 | BR2.5 porte la commutativité sur `[StockMovementView, QuantityBase]`. BR3.2 recentrée sur Cump ≥ 0 et restauration de quantité. | — | Resolved |
| R-06 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/rules.md > BR5.3 | BR5.3 documente le mode `credit` avec logique et extension U10 ; artefacts cohérents. | — | Resolved |
| R-07 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/functional-spec.md > WF6 | AL-01, AL-02, AL-03, AL-04, AL-08 figurent dans le catalogue WF6 avec leur déclencheur et variant `DomainEvent`. | — | Resolved |
| R-08 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/rules.md > BR5.3 `statement` ; entities.md > PaymentItem contrainte l. 91 | La contradiction du `statement` est levée : il indique désormais « changeDue = Σ_tous_modes − total_ttc ; changeDue ≤ Σ espèces sinon refus ; le crédit couvre le total mais n'alimente pas le plafond du rendu ». La contrainte de `PaymentItem` (l. 91) est alignée : « mode credit : hors plafond U10 ; compte dans Σ pour couvrir total_ttc ; n'entre pas dans le plafond du rendu (espèces seules) ». La contrainte de `PaymentPlan` (l. 117 : « Modes credit exclus du calcul du rendu ») garde une formulation imprécise (→ R-11), mais les deux sources canoniques sont désormais sans ambiguïté. | — | Resolved |
| R-09 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/entities.md > `DomainEvent` contrainte cash_outflow ; functional-spec.md > WF6 l. 94 | La contrainte `DomainEvent` indique désormais « cash_outflow → alimente AlertHistory.recentSessions (AL-10 glissant ; pas d'émission directe) ». WF6 l. 94 confirme : « AL-10 n'est **pas** émise sur chaque `cash_outflow` : l'événement alimente seulement l'historique ». La classification double est résolue. | — | Resolved |
| R-10 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/functional-spec.md > WF4 étape 5 ; entities.md > PricedLine attribut `lineAmountHt` | WF4 étape 5 documente explicitement « `PricedLine[]` reconstruits par spread avec `lineAmountHt` renseigné (immutabilité WF3 respectée) » et affirme « Σ lineAmountHt = totalHt ». La convention est sans ambiguïté pour le développeur. | — | Resolved |
| R-11 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/functional-design/entities.md > entité PaymentPlan, contrainte l. 117 | La contrainte `PaymentPlan` l. 117 « Modes credit exclus du calcul du rendu (EF-U8-03) » est formulée différemment des sources canoniques : BR5.3 inclut le crédit dans Σ pour calculer `changeDue`, et le crédit n'est exclu que du **plafond** (changeDue ≤ Σ espèces). Un développeur lisant uniquement l. 117 pourrait conclure que le crédit est absent du Σ, ce qui produirait un `changeDue` incorrect. Ce risque est limité par la contrainte adjacente l. 116 et par BR5.3, mais la terminologie reste piégeuse. | Remplacer l. 117 par « Modes credit exclus du plafond du rendu (Σ complet inclut le credit ; ceiling = Σ espèces seules) » afin d'aligner la contrainte de `PaymentPlan` sur celle de `PaymentItem` l. 91 et sur BR5.3. | New |

### Résultats des outils de validation

Aucun outil de validation automatique n'est déclaré dans la définition de l'étape `functional-design`. La vérification a été conduite manuellement sur les quatre artefacts de l'itération (functional-spec.md, entities.md, rules.md, traceability.json) et les contrats partagés d'inception.

| Outil | Résultat | Interprétation |
|---|---|---|
| Vérification R-08 : BR5.3 statement + PaymentItem l. 91 | PASS | Statement sans contradiction ; PaymentItem explicite (credit ∈ Σ, exclu du plafond) |
| Vérification R-08 résiduel : PaymentPlan l. 117 | FAIL partiel | « Calcul du rendu » vs « plafond du rendu » → nouveau R-11 (Minor) |
| Vérification R-09 : DomainEvent cash_outflow + WF6 | PASS | Deux occurrences alignées : AL-10 glissant, pas d'émission directe sur cash_outflow |
| Vérification R-10 : WF4 étape 5 convention spread | PASS | Convention documentée ; Σ lineAmountHt = totalHt affirmé |
| Vérification frontière domaine pur (BR9.1) | PASS | Aucune référence à SQLite, ORM, Electron, réseau ou framework UI dans les artefacts |
| Vérification entiers DEC-04 | PASS | MoneyFcfa (integer), QuantityBase (milliUnits integer), Cump (milliFcfaPerBase integer, min: 0), RateBp (basisPoints integer) — cohérents |
| Vérification traceability.json couverture | PASS | FR2.1 → FR2.10 OK ; FR4.16 GAP justifié (UI, reporté U5) ; BR9.1 reverse N/A justifié |
| Vérification catalogue WF6 vs AlertHistory | PASS | AL-06, AL-07, AL-10, AL-11 glissantes cohérentes ; AL-10 rôle intermédiaire documenté |

### Synthèse

Les trois mineurs de l'itération 1 (R-08, R-09, R-10) sont tous résolus : BR5.3 et PaymentItem expriment sans ambiguïté que le crédit entre dans Σ pour `changeDue` mais est exclu du plafond ; la double classification d'AL-10 est levée par une note explicite dans `DomainEvent` et dans WF6 ; WF4 documente la convention spread pour `PricedLine[]` et garantit que `lineAmountHt` est présent en sortie. Un seul mineur résiduel (R-11) subsiste : la contrainte de `PaymentPlan` l. 117 conserve la formulation imprécise « exclu du calcul du rendu » que PaymentItem et BR5.3 ont abandonnée. Ce point peut être corrigé en une ligne sans aucun impact structurel. Le design reste pleinement implémentable en l'état.

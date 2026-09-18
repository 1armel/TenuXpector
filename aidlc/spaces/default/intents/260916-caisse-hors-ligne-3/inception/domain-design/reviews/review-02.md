## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-18T06:12:00Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | components.md > bloc `components` (`depends_on`/`dependents`) | Re-dérivation manuelle complète des 31 arêtes `depends_on` : chacune a désormais sa contrepartie `dependents` exacte (31 entrées de chaque côté, somme vérifiée), et le diagramme mermaid reproduit les 31 arêtes une à une dans le même sens (fournisseur → appelant). Le graphe reste acyclique : un tri topologique complet (Credit/Settings/Identity en base, jusqu'à Receipt au sommet) passe sans blocage, y compris pour la nouvelle arête Catalog→SensitiveDataGuard, qui ne referme aucun cycle car SensitiveDataGuard ne dépend que d'Identity (une feuille). | Aucune. | Resolved |
| R-02 | Major | components.md > entités Sale, SaleLine, Payment, Cart, RegisterSession, CashMovement, DrawerOpening, CustomerAccountEntry, GoodsReceipt, GoodsReceiptLine, Invoice, TrustedDevice, PinAttempt | Les blocs `references` ont été ajoutés pour les 13 entités citées, et chaque `references[].entity` résolu contre son `owned_by` correspond à une entité réellement possédée par ce composant (vérifié un par un : Product/Catalog, SellingUnit/Catalog, RegisterSession/CashSession, Customer/Credit, User/Identity, Sale/SaleCalculator, GoodsReceipt/Procurement, Supplier/Procurement). Le tableau « Propriété des entités » reproduit fidèlement ces références. | Aucune. | Resolved |
| R-03 | Major | components.md > TransactionalWriter/Credit ; decisions.md > ADR-005 | `TransactionalWriter.depends_on` porte désormais `Credit`, et `Credit.dependents` porte `TransactionalWriter` en retour ; ADR-005 décrit ce même mécanisme (« Ce lien est déclaré dans le catalogue — TransactionalWriter dépend de Credit, et Credit liste TransactionalWriter parmi ses appelants ») et correspond exactement à ce qui est écrit dans le catalogue. | Aucune. | Resolved |
| R-04 | Minor | components.md § « Propriété des entités » (phrase d'héritage) et entités Cart, PrintJob | La phrase d'héritage ajoutée couvre SaleLine/Payment (par Sale), CashMovement/DrawerOpening (par RegisterSession), CustomerAccountEntry (par Customer), GoodsReceiptLine (par GoodsReceipt), PinAttempt (par User) et SellingUnit (par Product) — correct pour ces sept entités. Mais deux entités filles restent sans `tenantId` et sans mention dans cette phrase : `Cart` (attributs `[id, sessionId, lines, createdAt, updatedAt]`), pourtant enfant de `RegisterSession` via `sessionId` exactement comme `CashMovement`/`DrawerOpening` qui, eux, sont cités ; et `PrintJob` (attributs `[id, kind, payload, status, attempts, lastError]`), qui n'a ni `tenantId` ni bloc `references` du tout, donc aucun chemin déclaré vers un tenant. L'invariant « toute requête sur une table métier filtre par tenant_id » (CLAUDE.md) reste donc non couvert pour ces deux entités. | Étendre la phrase d'héritage à `Cart` (par `RegisterSession`) et donner à `PrintJob` soit un `tenantId` propre, soit une référence déclarée vers l'entité dont il hérite le tenant (par exemple la vente ou le rapport imprimé). | Unresolved |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Re-dérivation manuelle de la symétrie `depends_on`/`dependents` | 31 arêtes de chaque côté, correspondance un-à-un vérifiée | Confirme la résolution de R-01 ; aucune asymétrie résiduelle trouvée |
| Tri topologique manuel du graphe de dépendances | Ordre total trouvé (Credit/Settings/Identity → … → Receipt), aucun cycle | Le graphe reste acyclique après l'ajout de Catalog→SensitiveDataGuard et TransactionalWriter→Credit |
| Comparaison arête par arête du diagramme mermaid contre le bloc YAML | 31/31 arêtes identiques, même sens (fournisseur → appelant) | Le diagramme n'a pas divergé du YAML après les modifications |
| Résolution de `references[].entity` contre `owned_by` (13 entités modifiées + entités préexistantes) | Toutes résolues vers une entité réellement possédée par le composant déclaré | Confirme la résolution de R-02 |
| Comptage de `traceability.json` | 82 `upstream_ids`, 82 entrées `coverage`, chaque `target` résolu vers un composant ou une entité existant dans components.md | Aucune régression de traçabilité introduite par les corrections |

### Summary

Les quatre corrections demandées sont vérifiées et trois sont pleinement résolues (symétrie et acyclicité du graphe, références croisées, mécanisme Credit/TransactionalWriter cohérent avec l'ADR-005). La correction de R-04 est partielle : la phrase d'héritage de tenant omet `Cart` (pourtant structurellement identique à `CashMovement`/`DrawerOpening`, cités) et ne traite pas du tout `PrintJob`, qui n'a aucun chemin déclaré vers un tenant. Ce point reste mineur et n'empêche pas la mise en œuvre, mais doit être corrigé avant la conception fonctionnelle qui s'appuiera sur ce catalogue.

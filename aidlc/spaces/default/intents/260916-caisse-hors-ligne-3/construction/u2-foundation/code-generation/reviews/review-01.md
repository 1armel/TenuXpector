## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-20T23:36:20Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | packages/db/src/catalog/product.ts > `insertProductRow` / `insertSellingUnitRow` | `assertHasBaseSellingUnit` est exportée mais n'est **pas** appelée depuis les helpers d'insertion ; la contrainte « au moins une SellingUnit avec `conversionFactor = 1000` » (BR5.3) est entièrement à la charge de l'appelant. Il n'existe aucun guard DB (CHECK ou trigger) qui l'enforcerait en dernier recours. Un développeur U4 intégrant `insertProductRow` sans lire la doc pourrait créer des produits sans unité de base. | Ajouter la vérification à `assertHasBaseSellingUnit` dans la doc JSDoc de `insertSellingUnitRow` en indiquant clairement qu'elle doit être appelée après l'insertion du lot, ou créer une fonction composite `insertProductWithUnits` qui la déclenche automatiquement. | New |
| R-02 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u2-foundation/code-generation/traceability.json > upstream_ids vs coverage array | `FR3.4` et `FR3.8` sont listés dans `upstream_ids` mais n'ont aucune entrée dans `coverage` ni dans `reverse`. Par ailleurs, BR1.1, BR1.2, BR1.4, BR1.5, BR2.1, BR2.2, BR2.3, BR2.4, BR3.1, BR3.2, BR4.1, BR4.3 et BR6.1 sont déclarés dans `upstream_ids` mais n'ont aucune ligne de couverture explicite, bien que les tests les couvrent en pratique. Un auditeur ne peut pas confirmer la traçabilité complète depuis le seul `traceability.json`. | Compléter le tableau `coverage` avec une entrée par ID déclaré dans `upstream_ids`, ou retirer de `upstream_ids` les IDs qui ne relèvent pas de U2 (vérifier si FR3.4 et FR3.8 font partie du périmètre ou doivent être déplacés en `deferred`). | New |
| R-03 | Minor | packages/db/src/encrypted-database.ts > `get connection()` (ligne 140) | L'accesseur `connection: SqliteConnection` est entièrement public, ce qui permet à n'importe quel consommateur de `@tenu/db` — y compris du code hors du paquet — d'effectuer des requêtes SQL directes en contournant les invariants typés (triggers append-only, isolation tenant, contrôles UUID v7). Un commentaire JSDoc met en garde, mais il n'y a aucun mécanisme de contrôle à la compilation ni à l'exécution. | Conserver l'accès interne au paquet (nécessaire aux services), mais envisager de marquer l'accesseur `@internal` avec un eslint-rule ou un lint no-restricted-imports qui interdise son usage hors de `packages/db/src/**`. Documenter explicitement dans l'ADR que l'accès direct à la connexion est réservé aux services internes du paquet. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Code review manuel — présence fichiers manifest | PASS : tous les 45 chemins de `source-manifest.json` ont été vérifiés présents dans le dépôt | Cohérence manifest vs livrable confirmée |
| Invariant append-only | PASS : triggers `audit_log_no_update`, `audit_log_no_delete`, `pin_attempts_no_update`, `pin_attempts_no_delete` présents dans `migrations.ts` ; tests `append-only.spec.ts` confirment RAISE(ABORT) | BR1.3 respecté |
| Outbox même TX | PASS : `TransactionalWriter.commit` lève `MissingOutboxError` si `outbox` est `null` ou `[]` ; test de rollback vérifié dans `outbox-transaction.spec.ts` | BR4.1–BR4.3 respectés |
| PinAttempt sans outbox (R-03) | PASS : `recordPinAttempt` insère directement sans passer par `TransactionalWriter` ; testé dans `outbox-transaction.spec.ts` « PinAttempt without outbox » | Exception R-03 correctement implémentée et testée |
| PIN PBKDF2-SHA256 | PASS : `MIN_PIN_ITERATIONS = 310_000` en constante ; `CHECK (pin_iterations >= 310000)` dans le schéma SQL ; timingSafeEqual utilisé | BR2.1 / ENF-08 respectés |
| Gérant → vendeur (R-05) | PASS : `assignGerant` rétrograde tout gérant actif précédent en `vendeur` via UPDATE ; `revokeGerant` force `role = 'vendeur'` ; testé dans `identity-roles.spec.ts` | R-05 / BR2.4 respectés |
| Isolation tenant | PASS : `assertTenantMatch` appelé dans `verifyPin`, `SettingsService.get`, `deactivateProduct` ; index unique `users_one_active_gerant_idx` scoped par `tenant_id` | BR1.5 respecté |
| SensitiveDataGuard | PASS : `maskProductForRole` filtre les 5 champs sensibles pour `vendeur` ; `assertNoSensitiveFieldsForVendeur` lève si fuite ; testé dans `sensitive-data-guard.spec.ts` | BR5.1 / §2.2 respectés |
| DEC-04 (entiers uniquement) | PASS : `reference_price`, `floor_price`, `price`, `conversion_factor` sont `INTEGER` en SQL ; `validateProductPrices` / `validateSellingUnit` vérifient `Number.isInteger` | DEC-04 respecté ; aucun flottant |
| ENF-14 | PASS : le seed reconstruit le mot commercial via `String.fromCharCode`; `check-forbidden-word.mjs` exclut le seed par chemin exact | ENF-14 respecté |
| Couverture déclarée | PASS : 92,71 % lignes / 80,19 % branches (seuil 80 %) pour `packages/db` ; `vitest.config.ts` seuils non abaissés | ENF-11 / team.md respectés |
| Migrations réversibles | PASS : `migrationFoundation.down` supprime toutes les tables dans l'ordre inverse des FK | Réversibilité V2 confirmée |
| UUID v7 côté client | PASS : `EncryptedDatabase.nextId()` via `createUuidV7Generator` ; aucun `AUTOINCREMENT` dans le schéma | BR1.4 respecté |
| Frontière U2 (pas de ventes / stock / SyncEngine) | PASS : aucune table `ventes`, `mouvements_stock`, `sessions_caisse` dans `migrationFoundation` ; `source-manifest.json` ne liste aucun fichier hors périmètre | Frontière respectée |

### Summary

L'implémentation de U2 est cohérente avec le plan sur tous les invariants critiques : append-only (audit + PinAttempt), outbox dans la même transaction, exception R-03 documentée et testée, masquage vendeur, PIN PBKDF2, gérant → vendeur, isolation tenant et types entiers DEC-04. Les trois trouvailles sont mineures (contrat d'appel implicite pour la base unit, lacunes de traçabilité documentaire, accesseur de connexion public) et ne bloquent pas la livraison. Un développeur peut implémenter les unités suivantes à partir de ce socle sans ambiguïté architecturale majeure.

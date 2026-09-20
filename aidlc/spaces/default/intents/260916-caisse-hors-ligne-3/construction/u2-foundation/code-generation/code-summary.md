# Résumé de génération de code — U2 `u2-foundation`

**Stage** : code-generation  
**Unité** : `u2-foundation`  
**Date** : 2026-09-21  
**Contrat de test** : `sha256:b356a15826709b0d19108118b423cf247d3d5a7823a4cfe4e4519403234c67db`

## Livrable

Paquet `@tenu/db` : moteur SQLite chiffré (levé depuis U1), migrations
réversibles (probe + fondation), Identity (PIN PBKDF2, PinAttempt sans outbox,
gerant → vendeur), Settings typés Zod, TransactionalWriter (audit + outbox
atomiques), SensitiveDataGuard, forme catalogue Product/SellingUnit, seed démo
(3 users, 200 articles, zéro vente).

Frontière respectée : pas de ventes, stock, CUMP, SyncEngine, ni écrans caisse.

## Étapes du plan

Toutes les étapes 1–13 du plan sont livrées. Ordre custom respecté : tests
d’abord pour append-only, outbox même TX, SensitiveDataGuard ; le reste couche
par couche puis tests.

Décisions FD : R-01 (recordedAt local), R-02 (tenant injecté), R-03 (PinAttempt
sans outbox), R-05 (révocation → `vendeur`), R-06 (Settings minimaux au seed).

## Preuves exécutées

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` | vert |
| `pnpm lint` | vert |
| `pnpm vitest run --dir packages/db --coverage` | vert — **57** tests ; **92,71 %** lignes / **80,19 %** branches |
| `pnpm test:unit` (pc-proof) | vert — **76** tests ; couverture ≥ 80 % |
| `node scripts/check-forbidden-word.mjs` | OK — seed exclu par chemin exact `packages/db/src/seed/demo-seed.ts` |

## Emplacement

Code sous `packages/db/` (jamais sous `aidlc/spaces/`). Les fichiers U1
`apps/pc-proof/src/main/database/*` réexportent `@tenu/db` pour préserver
probe_entries et les tests existants.

## Écarts / non-faits volontaires

1. **Tables ventes / mouvements** : hors U2 (reportées U5 / U3).
2. **`serverTimestamp` audit** : différé U8 (R-01).
3. **Transport SyncEngine** : hors U2 (U8) ; l’outbox s’accumule localement.
4. **Couverture `encryption-key` / `defaults`** : couverts via imports et tests
   Identity/Settings ; le rapport v8 les agrège parfois sous les modules
   consommateurs selon l’instrumentation.

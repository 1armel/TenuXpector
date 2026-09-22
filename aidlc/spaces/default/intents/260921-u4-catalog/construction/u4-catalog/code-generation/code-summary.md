# Résumé de génération de code — U4 `u4-catalog` · Bolt C1

**Stage** : code-generation  
**Unité** : `u4-catalog`  
**Bolt** : C1 (squelette marchant)  
**Date** : 2026-09-22  
**Contrat de test** : `sha256:c44bd79114cddc934449db5659efd16d2b601fd36006acc2fdbe5e70a4dce71c`

## Livrable

Catalogue embarqué dans la caisse (pc-proof) : création minimale 4 champs,
code interne, plancher ≤ référence, recherche sans accents, masquage des coûts
vendeur, persistance Product/SellingUnit + `journal_audit` + `outbox` atomique,
canaux IPC Zod (`catalog.search`, `catalog.getProduct`, `catalog.saveProduct`),
UI `CatalogShell` / `RoleGate`.

Hors C1 (volontaire) : saisie série, synonymes UI, désactivation, étiquette,
import, photo, OCR, UI catégories (seed lecture seule — R-01 FD).

## Étapes du plan

Toutes les étapes 1–7 du plan sont cochées. Ordre respecté : domain tests
d’abord → DB → IPC → UI → seed → artefacts / porte `typecheck && lint && test`.

Spec domaine déplacée en `packages/domain/tests/catalog.spec.ts` pour être
ramassée par `pnpm test:domain` (`vitest --dir packages/domain`).

## Preuves exécutées

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` | vert |
| `pnpm lint` | vert |
| `pnpm test` (`test:unit` + `test:db` + `test:domain`) | vert |
| Domain catalog (17 tests) | ≥ 90 % lignes/branches (seuil package) |
| DB catalog (9 tests) | vert ; couverture package ≥ 80 % |
| UI / IPC catalog (12 tests) | vert ; couverture pc-proof ≥ 80 % |
| Hooks `.githooks/pre-commit`, `pre-push` | mode `755` |

## Écarts / non-faits volontaires (C1)

1. **Catégories** : seed / lecture seule ; pas d’UI de création (R-01 FD).
2. **C2–C4** : clavier/désactivation/étiquette, import, photo — après porte squelette.
3. **Parcours E2E Playwright catalogue** : dû à J1, non bloquant à chaque fusion (contrat de test).

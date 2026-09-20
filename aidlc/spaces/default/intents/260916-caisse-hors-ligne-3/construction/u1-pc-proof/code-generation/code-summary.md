# Résumé de génération de code — U1 `u1-pc-proof`

**Stage** : code-generation  
**Unité** : `u1-pc-proof`  
**Date** : 2026-09-20  
**Contrat de test** : `sha256:b356a15826709b0d19108118b423cf247d3d5a7823a4cfe4e4519403234c67db`

## Livrable

Preuve de concept PC sous Electron : coquille durcie, base SQLite chiffrée
(WAL + `synchronous=FULL`), composition ESC/POS avec trois voies d’impression,
parcours IPC validé Zod, banc d’arrêts forcés et squelette E2E Playwright.

Aucune règle métier (stock, vente, clôture) : frontière U1 respectée.

## Étapes du plan

Toutes les étapes 1–17 du plan sont cochées. Ordre respecté : couche puis test
(custom) ; exception étape 8 — harnais power-cut avant / avec l’adaptateur déjà
présent.

## Preuves exécutées

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` | vert |
| `pnpm lint` | vert |
| `pnpm vitest run --dir apps/pc-proof --coverage` | vert (≥ 80 % lignes et branches) |
| `pnpm vitest run tests/resilience/power-cut.spec.ts` | vert — **10/10** arrêts, intégrité OK, lots transactionnels intacts |
| `pnpm playwright test tests/e2e/pc-proof.spec.ts` | prêt ; saute si `out/main/main.cjs` absent (`pnpm build` requis) |

### Chiffre power-cut (étape 10)

```
POWER_CUT_SUMMARY {"forcedStops":10,"results":[…10× {committedBeforeKill:25, afterReopen:25}…],"allIntegrityOk":true,"minSurvivingRows":25}
```

## ADR

- `docs/adr/001-encrypted-database-engine.md`
- `docs/adr/002-thermal-print-path.md`
- `docs/adr/003-electron-version.md`

## Écarts / non-faits volontaires (J0 physique)

1. **Impression USB physique** : non exécutée ici (environnement Linux / pas
   d’imprimante 80 mm). La voie est câblée ; la validation manuelle Windows
   reste un critère de sortie J0.
2. **E2E Electron build** : le spec est écrit ; il exige `pnpm build` avant
   exécution complète.

## Glossaire

Amorce : `docs/glossaire-fr-en.md`.

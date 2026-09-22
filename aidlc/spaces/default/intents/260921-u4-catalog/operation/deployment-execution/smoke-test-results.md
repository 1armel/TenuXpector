# Smoke test results — Deployment Execution

**Summary Authorization Id:** 587fea7070514668621a7ec9876fb2bb87e09ddcd3ed4ea4fa9d541bca9340e2

## Matrice

| ID | Preuve | Environnement | Verdict |
|---|---|---|---|
| SMK-BUILD | `pnpm build` exit 0 (2026-09-22T22:50:44Z) | ENV-DEV | Met |
| SMK-TYPECHECK | Build and Test `pnpm typecheck` | ENV-DEV (BT) | Met |
| SMK-LINT | Build and Test `pnpm lint` | ENV-DEV (BT) | Met |
| SMK-TEST | Build and Test `pnpm test` (251 tests) | ENV-DEV (BT) | Met |
| SMK-C1-UI-BOUTIQUE | Parcours manuel catalogue (créer / retrouver / masquer coûts) sur PC caisse | ENV-BOUTIQUE | **Not Met** (Q2-B ; différé sous HOLD) |

## Détail Q2-B

Le smoke UI boutique est **obligatoire** pour un SUCCESS d’install caisse. Il n’a pas été exécuté : ENV-BOUTIQUE non provisionné + Q1-A (pas d’install maintenant).

Re-run de cette étape (ou Deployment Execution ultérieur) requis quand :
1. HOLD Construction→Operation levé (ou accepté pour install partielle C1),  
2. PC caisse disponible,  
3. Parcours C1 manuel consigné ici comme Met.

## Référence

`construction/build-and-test/test-results.md` — suite verte Accept failure ENF-02/16.

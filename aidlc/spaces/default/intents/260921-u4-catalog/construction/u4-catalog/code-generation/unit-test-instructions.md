# Instructions de test — U4 Catalogue · Bolt C1

## Framework

- Vitest (déjà à la racine) + `@vitest/coverage-v8`
- fast-check pour propriétés entières (DEC-04) si pertinent
- Testing Library pour composants React renderer

## Commandes unit-scopées (obligatoires avant le premier rouge)

Exécuter **ces** commandes (pas `pnpm test` nu pour le cycle TDD catalogue) :

```bash
# Domain — règles Catalog C1
pnpm exec vitest run packages/domain/src/catalog --coverage --coverage.include='packages/domain/src/catalog/**/*.ts' --coverage.thresholds.lines=90 --coverage.thresholds.branches=90

# DB — persistance catalogue
pnpm exec vitest run packages/db/src/catalog --coverage

# IPC / UI pc-proof — surfaces catalogue C1
pnpm exec vitest run apps/pc-proof/src --coverage --testPathPattern='catalog'
```

Porte de fin de tâche (après le Bolt) :

```bash
pnpm typecheck && pnpm lint && pnpm test
```

## Couverture

| Zone | Seuil |
|---|---|
| `packages/domain` (dont catalog) | ≥ 90 % lignes et branches |
| `packages/db`, `apps/pc-proof` | ≥ 80 % lignes et branches (vitest.config) |

## Volume C1 (Comprehensive)

| Composant | Fichiers de test cibles | Contenu min. |
|---|---|---|
| Catalog domain | `packages/domain/src/catalog/*.test.ts` | 10–15 : création min, plancher, code unique, recherche accents, projection vendeur |
| Catalog db | `packages/db/src/catalog/*.test.ts` | Persist + outbox atomique ; pas de DELETE ; tenant_id |
| IPC / UI | `apps/pc-proof/src/**/*catalog*.test.ts(x)` | Zod reject ; RoleGate ; search+save happy + 2 erreurs |

## Mocking

- Domain : aucun mock I/O (fonctions pures)
- DB : SQLite en mémoire / fichier temp chiffré selon patterns existants `packages/db`
- UI : mock preload IPC ; ne pas toucher moniteur réel

## Données de test

- Montants entiers FCFA ; UUID v7 ; `tenant_id` fixe de fixture
- Jamais de prix d’achat dans assertions vendeur

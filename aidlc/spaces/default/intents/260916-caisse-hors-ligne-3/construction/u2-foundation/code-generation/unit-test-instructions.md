# Consignes de test — U2 Socle (`u2-foundation`)

Stratégie active : `Comprehensive`. Dix à quinze tests par composant ciblé. Cas nominal + ≥ 2 erreurs/limites. Aucun test qui passe quel que soit le code.

## Outillage

| Usage | Outil |
|---|---|
| Unitaire / intégration | Vitest (`vitest.config.ts` racine) |
| Couverture | `@vitest/coverage-v8`, seuils déclarés jamais abaissés |

Pas de Playwright E2E caisse complet dans cette unité (pas d’écran vente). Les tests d’intégration SQLite utilisent une **vraie** base chiffrée temporaire (héritage U1), jamais un faux en mémoire pour les invariants append-only / transaction.

## Commandes de l’unité

```bash
# Paquets touchés par U2 (ajuster les chemins réels après scaffolding)
pnpm vitest run --dir packages/db --coverage
pnpm vitest run --dir packages/domain --coverage
# Si Identity/Settings vivent ailleurs, ajouter le --dir correspondant
```

La commande unitaire doit être exécutable dès que le premier paquet testable existe.

## Seuils

| Périmètre | Lignes | Branches |
|---|---|---|
| Chaque paquet hors `domain` | 80 % | 80 % |
| `packages/domain` (si code ajouté) | 90 % | 90 % |

Exclusions : `*.d.ts`, générés, migrations SQL brutes, seed.

## Répartition attendue

| Composant | Focus tests |
|---|---|
| Migrations / immutabilité | UPDATE/DELETE AuditEntry et PinAttempt refusés ; down migration |
| Identity PIN | dérivation, succès/échec, blocage 5/10 min, PinAttempt sans outbox |
| Identity rôles | assignation unique gerant, révocation → vendeur, audit+outbox |
| Settings | Zod, défauts, surcharge magasin, refus valeur invalide |
| SensitiveDataGuard | vendeur sans champs sensibles ; gérant/proprio les voit |
| TransactionalWriter | atomicité ; outbox obligatoire ; séquence ; rollback |
| Product schéma | pas de qty ; contraintes prix ; désactivation |
| Seed | 3 users, 200 articles, zéro vente |

## Invariants tests d’abord

1. Append-only AuditEntry / PinAttempt  
2. Outbox dans la même transaction que la mutation métier (sauf PinAttempt, R-03)  
3. Masquage vendeur (SensitiveDataGuard)

## Ce qu’un test ne doit pas faire

- Calculer stock / CUMP / totaux de vente  
- Dépendre du réseau  
- Contenir le mot interdit ENF-14 hors chemin seed exact  
- Abaisser un seuil de couverture pour passer  

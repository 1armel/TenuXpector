# Configuration CD — U4 Catalogue

**Summary Authorization Id:** 0f60ce4780ba597077404a47f827150a7cac18849233c5ada54795fe503229bc

## Objectif

Pas de pipeline CD cloud. La « livraison continue » est un **processus manuel documenté** : produire un build Electron vérifié, le transporter hors bande, l’installer sur le PC caisse, avec porte humaine.

## Chaîne de livraison

```
CI GitHub Actions (qualité + build-electron)
        │
        ▼
Artifact Actions (pc-proof-build, 7 j)  OU  `pnpm build` local
        │
        ▼
Transfert USB / partage local (hors réseau métier obligatoire)
        │
        ▼
Install sur PC boutique (prod locale) — après approbation humaine
        │
        ▼
Migration SQLite au démarrage (réversible) + smoke catalogue C1
```

## Outils

| Élément | Rôle |
|---|---|
| `.github/workflows/reusable-ci.yml` job `build-electron` | Produit `apps/pc-proof/out` |
| Hooks locaux | Porte merge développeur (audit, ENF-14, suite) |
| Aucun CodeDeploy / ECS / S3 promote | CT-07 |

## Secrets / signing

- Pas de secrets catalogue cloud.
- Si signature Electron existe déjà : réutiliser le secret store CI existant ; sinon build non signé acceptable hors boutique jusqu’à cadrage signing.

## Hors scope CD

- Auto-push vers serveur boutique
- Blue/green, canary, rolling cloud
- Feature flags distants

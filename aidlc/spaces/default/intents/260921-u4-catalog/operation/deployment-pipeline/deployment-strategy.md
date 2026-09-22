# Stratégie de déploiement — U4 Catalogue

**Summary Authorization Id:** 0f60ce4780ba597077404a47f827150a7cac18849233c5ada54795fe503229bc

## Stratégie choisie (Q1-A)

**Install manuelle versionnée** — équivalent « big bang » sur un seul poste, sans trafic parallèle.

| Dimension | Choix |
|---|---|
| Pattern cloud | Aucun (pas blue/green, canary, rolling) |
| Unité de déploiement | Build Electron `pc-proof` (C1+ catalogue embarqué) |
| Transport | USB ou partage local |
| Couplage données | Fichier SQLite chiffré local ; migrations au boot |

## Environnements (Q2-A)

| Env | Machine | Porte |
|---|---|---|
| Dev | Poste développeur | Hooks + CI verte |
| Prod locale | PC caisse boutique | **Approbation humaine explicite** avant copie/install |

Pas de staging cloud. Un PC staging physique reste option future (non retenu).

## Matrice de promotion

| De | Vers | Preuves | Approbateur |
|---|---|---|---|
| Dev | Artifact / build local | CI `typecheck`+`lint`+`test`+`build-electron` verts | Développeur |
| Artifact | PC boutique | Checklist smoke (ci-dessous) + backup DB | Propriétaire / gérant + développeur |

## Checklist smoke post-install (C1)

1. App démarre hors ligne.
2. Rôle vendeur : recherche article sans prix d’achat / CUMP / marge.
3. Rôle propriétaire/gérant : créer fiche minimale 4 champs, retrouver via recherche.
4. Migration appliquée sans erreur ; pas de perte de ventes existantes.

## Feature flags (Q4-A)

Aucun flag distant. Activation = version installée + valeurs `parametres` en base locale.

## Lien avec HOLD Construction→Operation

Cette stratégie documente la livraison **quand** C2–C4 / ENF-02 / ENF-16 / R-01–R-02 le permettront. Elle n’autorise pas une install boutique « complète U4 » tant que le phase-check reste HOLD.

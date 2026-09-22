# Carnet des unités — U4 Catalogue et saisie

Unités candidates **à l’intérieur de cette intention**. Entrées : `scope-document.md`, `intent-statement.md`, `feasibility-assessment.md`, `constraint-register.md`.

Le découpage définitif (Unit of Work) sera fait à l’étape de génération des unités ; ce carnet fixe la liste, les priorités et l’ordre **dans U4**.

## Méthode de priorisation

- **MoSCoW** : tout le carnet est **Must** — le minimum démontrable (périmètre Q1-C) est la fin d’intention, pas un sous-ensemble Should.
- **Ordre** : valeur d’abord (périmètre Q2-A), puis le risque OCR. Chaque tranche ne commence que lorsque celles dont elle dépend sont utilisables.
- **WSJF informel** : clavier + import ont le plus fort « coût du délai » (sans eux, pas de vente réelle) ; la photo réduit le risque de saisie longue mais n’est pas le chemin critique de J1.

## Carnet ordonné

| Ordre | Tranche | MoSCoW | Dépend de | Ce que la tranche prouve | Jalon |
|---|---|---|---|---|---|
| 1 | C1 — Fiche, recherche, rôles | Must | Socle u1–u3 (déjà livré) | Qu’un propriétaire / gérant crée et voit une fiche complète, qu’un vendeur recherche sans voir les coûts | J1 |
| 2 | C2 — Saisie clavier et désactivation | Must | C1 | Qu’on crée 50 articles au minimum en moins de 15 min (ENF-16), en série, avec duplication et code interne / étiquette | J1 |
| 3 | C3 — Import générique sans stock | Must | C1 | Qu’un fichier aux colonnes inconnues se mappe, se prévisualise et crée articles + prix **sans** mouvement de stock | J1 |
| 4 | C4 — Photo, preuve de concept, adaptateur figé | Must | C1, C3 (réutilise le chemin d’import validé) | Que désignations et prix extraits d’une image passent par vérification humaine, et que le moyen est tranché (sur l’appareil si pas de spécimen) | J2 |

C2 et C3 peuvent avancer en parallèle après C1 ; C4 attend au minimum C1 et le contrat d’import de C3.

## Carte de la chaîne de valeur

Du travail de développement à la valeur pour le propriétaire :

```
Socle u1–u3 déjà livré
  → C1 Fiche / recherche / rôles
    → C2 Saisie clavier (ENF-16)  ·  C3 Import générique
      → J1 Catalogue opérable à la caisse (démo hors boutique)
        → C4 Photo + deux voies + adaptateur figé
          → J2 Fin U4 → unité suivante
            → (plus tard) saisie du registre réel en boutique
```

Valeur perçue à chaque étape :

| Étape | Valeur |
|---|---|
| J1 — catalogue opérable | Le propriétaire voit ses articles dans la caisse déjà livrée, saisis au clavier ou par fichier, sans attendre la photo |
| J2 — photo figée | Une page de registre (démo) entre sans tout retaper ; le moyen de reconnaissance n’est plus un pari |
| Après U4 | Unité suivante du produit ; le registre complet reste hors de cette intention |

## Hors carnet de cette intention

Vente / encaissement / clôture, impression, application propriétaire, serveur, AWS, UI tablette, quantités à l’import, moteur OCR maison — voir `scope-document.md` § Hors du périmètre.

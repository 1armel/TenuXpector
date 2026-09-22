# Note d’initiative — U4 Catalogue et saisie

Entrées : `intent-statement.md`, `stakeholder-map.md`, `feasibility-assessment.md`, `constraint-register.md`, `scope-document.md`, `intent-backlog.md`, réponses confirmées de `approval-handoff-questions.md`.

## Intention et problème

Sans articles et prix dans le système, la caisse déjà livrée (u1–u3) ne sert pas en boutique. U4 (`u4-catalog`) remplace aussi la saisie papier du registre par fiche, recherche, clavier, import générique et photo du registre (FR3.1–FR3.8).

Le propriétaire et le gérant saisissent le catalogue ; le vendeur ne fait que rechercher, sans jamais voir prix d’achat, CUMP, marge, CA cumulé ni valorisation.

## Marché

Hors plan de travail (recherche marché sautée). L’investissement est une unité interne sur un socle déjà livré, pas un nouveau produit.

## Faisabilité et risques

**Faisable sous trois conditions** : isoler la reconnaissance de texte (deux voies, puis figer) ; n’envoyer aucune image à un tiers avant un spécimen du registre (CR-02) ; ne pas bloquer la démo sur le papier réel.

Risques restants acceptés pour l’Inception (Q2) : OCR imparfait (clavier + import restent complets) ; sans spécimen, on fige **sur l’appareil**.

## Périmètre

| Dans U4 (Must) | Hors de cette intention |
|---|---|
| Fiche, recherche, saisie clavier, désactivation / étiquette | Quantités / mouvements de stock à l’import |
| Import générique (colonnes mappées), articles et prix seulement | Écran de vente / encaissement / clôture (déjà u3) |
| Photo du registre + moyen tranché et figé | Impression, app propriétaire, serveur, AWS |
| Démo hors boutique, données de démonstration | UI catalogue tablette Android |

**Jalons** : J1 catalogue opérable (valeur d’abord) → J2 photo figée (fin U4). Tranches C1–C4 dans `intent-backlog.md`.

## Concept visuel

Pas de maquettes dans ce plan. L’interface est embarquée dans la caisse Electron déjà livrée.

## Équipe

Pas de formation d’équipe. Le développeur enchaîne tout de suite, seul (Q3). Il décide l’ordre technique ; le propriétaire tranche le métier.

## Recommandation

**Go.** Passer à l’Inception sur ce périmètre (Q1).

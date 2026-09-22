# Conception fonctionnelle — Questions (`u4-catalog`)

**Construction.** Une seule unité UI. Les artefacts dus : `functional-spec.md`, `frontend-components.md`, `traceability.json` (pas de `entities.md` / `rules.md` séparés pour un kind `ui` — les règles catalogue sont dans la spec). Option A = recommandation. Réponses courtes ; le reste est déjà tranché (FR3, contrats, maquettes, C1–C4).

## Q1. Profondeur de cette passe de conception ?

Contexte : le Bolt de code suivant est **C1** (fiche / recherche / rôles), mais l’unité entière est `u4-catalog`.

A. Spec **complète U4** (C1–C4) maintenant, avec workflows C1 détaillés et C2–C4 en enchaînements + états ; le code commencera par C1
B. Spec **C1 seulement** ; C2–C4 plus tard (autre passe)
C. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Où documenter les règles métier catalogue (plancher, recherche, masquage) ?

Contexte : kind `ui` → pas d’artefact `rules.md` obligatoire ; le domaine vit quand même dans `packages/domain`.

A. Les numéroter **BR3.x** dans `functional-spec.md` (et la trace FR→BR) ; l’implémentation code ira dans `packages/domain` comme prévu
B. Inventer un `rules.md` hors liste d’artefacts du moteur
C. Pas de règles numérotées ; prose seule
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Spec **complète U4** maintenant ; code commence à **C1**
- Règles **BR3.x** dans `functional-spec.md` → code dans `packages/domain`

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

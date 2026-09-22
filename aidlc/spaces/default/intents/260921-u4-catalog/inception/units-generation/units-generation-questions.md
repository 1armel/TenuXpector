# Génération des unités — Questions (U4 Catalogue)

Le carnet d’idéation (C1–C4) et les pratiques parlent de **Bolts** à l’intérieur de l’unité produit `u4-catalog`. Cette étape fixe les **unités de travail** (DAG pour la construction), pas l’ordre économique (Delivery Planning). Requirements absents — on s’appuie sur `components.md` et le carnet. Option A = recommandation.

## Q1. Combien d’unités de travail pour cette intention ?

Contexte : le plan V1 a déjà une unité `u4-catalog`. Le socle u1–u3 est livré. C1–C4 sont des tranches de construction, pas forcément des unités séparées.

A. **Une seule** unité `u4-catalog` (dossier `u4-catalog`) : elle contient Catalog, CatalogImport, CatalogCapture, CatalogUi et l’extension de TransactionalWriter / SensitiveDataGuard ; C1–C4 restent des Bolts à l’intérieur
B. **Deux** unités : `u4-catalog-domain` (library : Catalog, Import, Capture) et `u4-catalog-ui` (ui : CatalogUi) avec dépendance ui → domain
C. **Quatre** unités alignées sur C1–C4
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q2. Quelle nature (`kind`) pour l’unité (ou les unités) ?

Contexte : `kind` pilote quels artefacts de conception Construction s’appliquent. L’UI vit dans `apps/pc-proof` ; les règles dans `packages/domain`.

A. Nature **`ui`** pour `u4-catalog` (écran embarqué dans la caisse) — les règles domain font partie de la même unité de livraison, sans unité library séparée dans cette intention
B. Nature **`library`** seulement (pas d’UI dans l’unité)
C. Nature **`service`** (processus déployable séparé)
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Q3. Comment exprimer la dépendance au socle déjà livré ?

Contexte : le DAG de cette intention ne doit lister que les unités **de ce record**. u1–u3 existent dans une autre intention / sur `main`.

A. Une seule unité `u4-catalog` avec `depends_on: []` dans le YAML de cette intention ; la dépendance au socle est décrite en prose (déjà sur `main`), pas comme nœud du DAG local
B. Réintroduire u1–u3 comme nœuds du DAG de cette intention
C. Pas encore défini
D. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Plan de découpage proposé :

- **1 unité** : `u4-catalog` (ID U4, dossier `u4-catalog`)
- **Kind** : `ui` — embarquée dans la caisse `apps/pc-proof`
- **Contenu** : Catalog, CatalogImport, CatalogCapture, CatalogUi ; SensitiveDataGuard et TransactionalWriter étendus au besoin
- **DAG local** : `depends_on: []` ; socle u1–u3 déjà sur `main` (prose seulement)
- **Bolts** (hors ordre économique ici) : C1–C4 restent des tranches internes, pas des unités

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]:Looks correct

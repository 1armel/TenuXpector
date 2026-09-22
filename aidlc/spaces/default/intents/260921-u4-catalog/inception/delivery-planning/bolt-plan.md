# Plan des Bolts — U4 Catalogue

Un **Bolt** est une tranche de construction avec un critère de fin et une hypothèse à vérifier. L’unité de travail runtime reste **`u4-catalog`** (un seul nœud du DAG) ; les Bolts découpent le travail à l’intérieur.

## Séquence

| Ordre | Bolt | Unité(s) | Squelette marchant ? | Porte |
|---|---|---|---|---|
| 1 | C1 — Fiche, recherche, rôles | `u4-catalog` | **Oui** | Oui — approbation avant C2 |
| 2 | C2 — Saisie clavier / désactivation / étiquette | `u4-catalog` | Non | Non (autonomie jusqu’à J1) |
| 3 | C3 — Import générique | `u4-catalog` | Non | Non (autonomie jusqu’à J1) |
| 4 | C4 — Photo + OCR figé | `u4-catalog` | Non | Oui — avant démarrage C4 / J2 |

## Bolt C1 — Squelette marchant

**Unités.** `u4-catalog`.

**Ce qu’il prouve.** Qu’une fiche créée par le propriétaire / gérant est recherchable, qu’un vendeur recherche sans voir les coûts (CT-09), et qu’un article de démo est utilisable à la caisse déjà livrée — de bout en bout (domaine → db → IPC → UI).

**Definition of Done.**
- Règles Catalog (création minimale, recherche, masquage) tests d’abord dans `packages/domain`
- Persistance + outbox via TransactionalWriter
- Canaux IPC Zod + onglet Catalogue (recherche + fiche) dans `apps/pc-proof`
- Seed / démo : au moins un article vendable à la caisse
- `pnpm typecheck && pnpm lint && pnpm test` verts ; hooks `+x` vérifiés

**Hypothèse de confiance.** « Un opérateur non technique retrouve un article par fragment de désignation et un vendeur ne voit aucun coût. »

**Démo attendue.** Créer une fiche, la retrouver, ouvrir la caisse et ajouter l’article au ticket.

## Bolt C2 — Clavier rapide

**Unités.** `u4-catalog`.

**Definition of Done.**
- Saisie en série, duplication, synonymes, suggestion multiple 50 (EF-U2-06–12)
- Désactivation ; contenu d’étiquette + impression via adaptateur existant (EF-U2-04/05)
- Chronométrage ENF-16 planifié pour J1 (médiane 3 essais) — mesure hors Playwright

**Hypothèse.** « 50 créations minimales / 15 min est tenable sur ce PC. »

**Démo.** Enchaîner 10 créations au clavier sans souris.

## Bolt C3 — Import générique

**Unités.** `u4-catalog`.

**Definition of Done.**
- Mapping colonnes, prévisualisation (OK / warn / error / doublon), commit sans stock
- Modèle fichier téléchargeable ; rapport d’erreurs accessible depuis l’UI (contrat C-01 à finaliser)
- Au moins un fichier démo importé

**Hypothèse.** « Un CSV aux colonnes inconnues produit des articles sans mouvement de stock. »

**Démo.** Importer un fichier mappé → articles en caisse.

## Bolt C4 — Photo / OCR

**Unités.** `u4-catalog`.

**Definition of Done.**
- PoC deux voies documentée ; adaptateur figé (sur appareil si pas de spécimen — CR-02)
- Écran de vérification ; commit via même chemin que l’import
- ADR adaptateur OCR

**Hypothèse.** « Une image locale de démo passe vérification → articles ; un seul moyen branché. »

**Démo.** Page image → vérification → articles.

## Jalons

| Jalon | Après | Critère |
|---|---|---|
| J1 | C2 + C3 | Catalogue opérable hors boutique |
| J2 | C4 | Moyen OCR figé ; fin U4 |

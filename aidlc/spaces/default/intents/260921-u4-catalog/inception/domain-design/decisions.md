# Décisions d’architecture — Domaine U4 Catalogue

Complète les ADR U3 (`260916-caisse-hors-ligne-3`) et les futurs `docs/adr/` pour l’adaptateur OCR. Entrées : `domain-design-questions.md` (Q1–Q4 = A), périmètre U4, maquettes.

## ADR-001 : Trois briques catalogue + UI séparée

**Contexte.** U4 doit livrer fiche/recherche, import générique et photo du registre dans la caisse déjà livrée, sans contaminer les règles pures par l’OCR ni par React. U3 avait déjà isolé `CatalogCapture`.

**Décision.** `Catalog` (règles) + `CatalogImport` (fichier) + `CatalogCapture` (photo) + `CatalogUi` (renderer `pc-proof`). OCR = dépendance externe de `CatalogCapture` seulement.

**Conséquences.**
- Positif : mapping fichier et OCR évoluent sans retoucher les tests de fiche ; CR-02 reste localisé ; ENF-16 / clavier-first vivent dans CatalogUi.
- Négatif : plus de frontières et d’assemblage IPC.
- Neutre : le déploiement reste un seul binaire Electron (Units Generation).

**Alternatives Rejected.**
- *Un seul Catalog pour tout* : lierait le cœur métier à un OCR non figé.
- *UI dans Catalog* : casserait la frontière `domain` pur.
- *Application catalogue séparée* : hors CT-01 / pratiques U4.

## ADR-002 : Réutiliser SensitiveDataGuard et TransactionalWriter

**Contexte.** CT-09 et l’atomicité outbox sont déjà tranchés en U3 (ADR-002 et ADR-003 de cette intention).

**Décision.** Pas de second filtre dans Catalog. Toute mutation catalogue passe par `TransactionalWriter` (articles + audit + outbox).

**Conséquences.**
- Positif : une seule preuve de masquage et d’atomicité.
- Négatif : TransactionalWriter grossit (formes ImportBatch / CaptureBatch).
- Neutre : SyncEngine hors U4 ; l’outbox s’accumule sans transport.

**Alternatives Rejected.**
- *Filtrage UI / CSS seul* : insuffisant pour CT-09.
- *Chaque composant ouvre sa transaction* : risque d’état partiel.

## ADR-003 : Étiquette via contenu Catalog + impression existante

**Contexte.** EF-U2-04 / FR3.8 exigent code interne et étiquette imprimable. L’impression ESC/POS USB est déjà livrée (U3).

**Décision.** `Catalog` génère le contenu d’étiquette ; `CatalogUi` déclenche l’adaptateur d’impression existant (`UsbEscPosPrinter`). Pas de nouveau composant d’impression dans U4.

**Conséquences.**
- Positif : pas de second stack d’impression ; maquette peut exposer « Imprimer étiquette ».
- Négatif : le parcours exact (création vs à la demande) reste à préciser en functional design / Bolt C1.
- Neutre : hors tablette.

**Alternatives Rejected.**
- *Nouveau composant LabelPrinter* : doublon avec l’adaptateur déjà présent.

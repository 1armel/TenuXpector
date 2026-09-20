# Génération de code — U1 preuve de concept PC — Questions

## Plan Approval

Le plan de génération est à `code-generation-plan.md`, et les consignes de test à `unit-test-instructions.md`, dans ce même dossier.

**Résumé du plan.** Dix-sept étapes, réparties en cinq blocs : le socle du dépôt (monorepo pnpm, TypeScript strict, Prettier et ESLint, banc de test, contrôles git), la coquille Electron durcie dès la première ligne avec un pont IPC validé par Zod, la base locale chiffrée précédée de son banc d'arrêts forcés, l'impression thermique derrière une interface à trois implémentations, puis le parcours de bout en bout, les trois ADR et la traçabilité.

**Ce que l'unité prouve.** Trois risques techniques et rien d'autre : que la base chiffrée tient sous Electron et Windows, qu'un ticket sort physiquement sur l'imprimante USB, et qu'une coupure de courant ne perd ni ne corrompt rien. Aucune règle métier n'est écrite ici.

**Résumé des consignes de test.** Stratégie `Comprehensive` : dix à quinze tests par composant, chacun avec le cas nominal et au moins deux cas d'erreur. Vitest pour l'unitaire et l'intégration, Playwright pour le bout en bout sur Electron. Couverture bloquante à 80 % des lignes et des branches sur cette unité. La base n'est jamais doublée — les tests tournent sur un vrai fichier chiffré, sinon ils ne prouveraient rien. L'imprimante est doublée sauf pour la vérification physique finale, qui est manuelle et consignée.

**Deux points où j'ai tranché, à confirmer ou corriger.**

1. L'ordre des tests. Le contrat d'équipe impose « tests d'abord » pour les règles de `packages/domain` et quatre invariants métier. Aucun des deux n'existe dans cette unité, donc c'est la seconde clause qui s'applique : implémentation couche par couche, puis tests avant la fusion. Seule exception, le banc d'arrêts forcés s'écrit avant l'adaptateur qu'il éprouve, parce qu'il est la preuve attendue de l'unité.
2. La voie d'impression sous Windows n'est pas choisie d'avance. Le plan prévoit deux implémentations derrière une même interface — envoi direct au périphérique USB, et octets bruts à la file d'impression Windows — et le choix se fait sur mesure. C'est le rôle d'une preuve de concept.

[Approval Fingerprint]: sha256:v3:65d0717d4b5ef7dd06d354d226c201a357400be2696bc26caa8f27e3f017178c
[Planned Source]: e9eacd95cbbbdc6c58e9893626c407b21f7e4a0bc627c46bae4958f14ae097a2

- "Approve Plan" — proceed to code generation
- "Request Changes" — revise the plan

[Answer]: Approve Plan

# Génération de code — U2 Socle (`u2-foundation`) — Questions

## Plan Approval

Le plan de génération est à `code-generation-plan.md`, et les consignes de test à `unit-test-instructions.md`, dans ce même dossier.

**Résumé du plan.** Treize étapes : schéma/migrations (identité, paramètres, audit, outbox, catalogue sans quantités), UUID v7 et isolation tenant, Identity (PIN PBKDF2, PinAttempt local sans outbox, gerant → révocation en `vendeur`), Settings Zod, SensitiveDataGuard, TransactionalWriter atomique, contraintes Product, seed 3 users + 200 articles sans ventes, ENF-14, traçabilité.

**Ce que l’unité construit.** Le socle partagé U0 : Identity, Settings, TransactionalWriter, SensitiveDataGuard — pas d’écran de vente, pas de calculs domaine stock/CUMP.

**Mineurs FD intégrés.** PinAttempt sans outbox (R-03) ; révocation gerant → `vendeur` (R-05) ; `serverTimestamp` différé U8 (R-01) ; Tenant/Store = install/seed (R-02).

**Résumé des consignes de test.** Comprehensive ; Vitest ; couverture 80 % (90 % domain si présent) ; tests d’abord pour append-only, outbox, masquage vendeur ; base chiffrée réelle pour les invariants.

[Approval Fingerprint]: sha256:v3:668db113627fc22681f7cdf57b35b4ea5f3077b67e90325b1629637e8e33be87
[Planned Source]: ba24dd09be1a665eb981013dbd798d5f9e5e053fc62a3f5a944b7572918c3b14

- "Approve Plan" — proceed to code generation
- "Request Changes" — revise the plan

[Answer]: Approve Plan

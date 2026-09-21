# Génération de code — U3 Domaine (`u3-domain`) — Questions

## Plan Approval

Le plan de génération est à `code-generation-plan.md`, et les consignes de test à `unit-test-instructions.md`, dans ce même dossier.

**Résumé du plan.** Quatorze étapes : squelette `@tenu/domain` + banc Vitest/fast-check (90 %), puis tests d’abord pour `arrondir`, StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine (événementiel + périodique), Reporting, propriétés EF-U1-11, porte typecheck/lint/test, traçabilité.

**Ce que l’unité construit.** Bibliothèque pure U1 : stock, CUMP, prix, totaux/paiements, caisse session, alertes, rapport — aucune base, UI ni réseau.

**Mineurs FD.** BR5.3 / credit (R-08, R-11) ; AL-10 glissant seulement (R-09) ; spread `lineAmountHt` (R-10).

**Résumé des consignes de test.** Comprehensive ; commande scopée `pnpm vitest run --dir packages/domain --coverage` avec seuils 90 % ; Red avant Green ; fast-check entiers ; pas d’E2E caisse.

[Approval Fingerprint]: sha256:v3:5e374818f8057b26c23f1bcc2ebda183d21bd39ce50ba21db37af926ccbba965
[Planned Source]: 631d39d08622f160d5f291dde08326cf96d4f7beb694f44255b851aa09b4d831

- "Approve Plan" — proceed to code generation
- "Request Changes" — revise the plan

[Answer]: Approve Plan

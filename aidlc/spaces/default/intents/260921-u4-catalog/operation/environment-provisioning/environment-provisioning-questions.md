# Environment Provisioning — Questions

> Contexte : CT-07 / infra — **aucun cloud**. Les « environnements » sont des postes physiques (dev, PC caisse). Pas de VPC, Secrets Manager, ni comptes AWS à provisionner.

## Q1. Périmètre de provisioning

Que faut-il inventorier / valider à cette étape ?

- A. Postes locaux seulement : machine développeur (Node 22, pnpm, hooks) + checklist PC boutique (Electron, SQLite chiffrée, imprimante ESC/POS, hors ligne) — aucun IaC AWS — recommandé
- B. Provisionner quand même un compte AWS / VPC « pour plus tard »
- X. Other (please specify)

[Answer]: A

## Q2. Secrets et paramètres

Où vivent secrets et paramètres d’environnement ?

- A. Clé SQLCipher / secrets locaux hors git ; métier dans table `parametres` ; secrets CI GitHub seulement pour signing si déjà présents — recommandé
- B. AWS Secrets Manager / Parameter Store
- X. Other (please specify)

[Answer]: A

## Q3. Validation sécurité / conformité (perspectives)

Quel niveau de validation pour cette étape ?

- A. Rapport de validation documentaire : OS à jour, app hors ligne, DB chiffrée, pas de sync cloud non autorisée, hooks ENF-08/14 actifs sur le poste dev — recommandé (C1 / HOLD boutique)
- B. Audit externe / pentest avant toute install
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

**Q1-A.** Inventaire = poste développeur + checklist PC boutique. Zéro AWS / VPC / IaC cloud.

**Q2-A.** Secrets hors git (SQLCipher) ; métier dans `parametres` ; CI signing optionnel existant seulement.

**Q3-A.** Validation documentaire (hors ligne, DB chiffrée, hooks ENF) — pas de pentest bloquant sous HOLD Construction→Operation.

Artefacts : `environment-inventory.md`, `validation-report.md` (perspectives plateforme / sécu / conformité intégrées).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

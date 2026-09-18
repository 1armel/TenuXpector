# Carnet des unités — TenuXpector V1

Unités candidates, classées pour la construction. Entrées : `scope-document.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/feasibility/feasibility-assessment.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/feasibility/constraint-register.md`.

Le découpage définitif en unités sera fait à l'étape de découpage en unités ; ce carnet en fixe la liste, les priorités et l'ordre.

## Méthode de priorisation

- **Classement MoSCoW** : Must pour ce qui est indispensable à la mise en service, Should pour ce qui est en V1 mais construit ensuite (périmètre Q2).
- **Ordre** : les risques d'abord (périmètre Q3), puis les dépendances. Chaque unité ne commence qu'une fois celles dont elle dépend terminées.

## Carnet ordonné

| Ordre | Unité | MoSCoW | Dépend de | Ce que l'unité prouve | Jalon |
|---|---|---|---|---|---|
| 1 | P0 — Preuve de concept sur PC | Must | — | Que la base chiffrée, l'impression USB et la survie aux coupures fonctionnent sous Electron et Windows | J0 |
| 2 | U0 — Socle | Must | P0 | Que le schéma à ajout seul, les migrations réversibles et l'authentification par PIN tiennent | J1 |
| 3 | U1 — Domaine | Must | U0 | Que les calculs de stock, de coût moyen et de marge sont justes en arithmétique entière | J1 |
| 4 | U2 — Catalogue et saisie rapide | Must | U0, U1 | Qu'un opérateur saisit un grand catalogue sans lecteur de codes-barres | J1 |
| 5 | U3 — Caisse hors ligne | Must | U1, U2 | Qu'une session de caisse complète se tient sans réseau | J1 |
| 6 | U4 — Impression | Must | U3 | Qu'un ticket conforme sort, et qu'une imprimante absente ne bloque jamais une vente | J1 |
| 7 | U5 — Audit, alertes, rapport | Must | U3 | Que chaque écart est imputable à une session et un opérateur | J2 |
| 8 | U6 — Synchronisation et application du propriétaire | Must | U3, U5 | Que le propriétaire suit l'activité à distance, sans que la caisse dépende du réseau | J2 |
| 9 | U7 — Approvisionnement | Should | U1, U2 | Que les entrées de stock au coût réel alimentent le coût moyen | J3 |
| 10 | U8 — Crédit client | Should | U3 | Que les ventes à crédit et les remboursements restent traçables | J3 |
| 11 | U10 — Facture A4 | Should | U3 | Qu'une facture simple sans TVA sort hors ligne | J3 |

## Carte de la chaîne de valeur

Du travail de développement à la valeur pour le propriétaire :

```
Preuve de concept PC (P0)
  → Socle + Domaine (U0, U1)
    → Catalogue saisi rapidement (U2)
      → Vente et clôture hors ligne (U3) → Ticket imprimé (U4)
        → Écarts imputables (U5) → Suivi sur téléphone (U6)
          → Approvisionnement (U7) · Crédit client (U8) · Facture A4 (U10)
            → Installation en boutique en une fois
              → Saisie du registre réel, puis usage quotidien
```

Valeur perçue par le propriétaire à chaque étape :

| Étape | Valeur |
|---|---|
| J1 — caisse démontrable | Il voit sa future caisse fonctionner sur ton PC |
| J2 — contrôle et suivi | Il sait qui tenait la caisse et où sont les écarts, même à distance |
| J3 — V1 complète | L'approvisionnement et le crédit quittent le papier |
| Installation | La boutique tourne sur l'application |

## Hors carnet V1

Inventaires tournants (U9), console multi-client (U11), tablette Android (à confirmer : dans la V1 ou après l'installation).

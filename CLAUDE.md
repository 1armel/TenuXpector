# Tenu — Instructions pour Claude Code

## Méthode : AI-DLC

Quand l'utilisateur écrit « Using AI-DLC » ou « Avec AI-DLC », lis et suis
`.aidlc/aidlc-rules/aws-aidlc-rules/core-workflow.md` pour démarrer le flux.
Les artefacts générés vont dans `aidlc-docs/`.

Entrées de référence, à lire au début de l'Inception :
- `docs/exigences-tenu.md` : exigences précises. **Fait foi.**
- `docs/specifications.md` : cadrage d'origine, pour le contexte et le « pourquoi ».

Pendant la Construction, ne lis que la section de l'unité en cours (U0 à U6) et les
sections transverses (§4 décisions, §6 règles de calcul, §7 alertes, §8 ENF).
Cite les identifiants (EF-, RG-, AL-, ENF-, DEC-) dans les plans, les tests et les commits.

Langue : toutes les questions, plans et documents AI-DLC sont rédigés en français.

## Invariants non négociables

- `mouvements_stock`, `mouvements_caisse`, `journal_audit`, `ouvertures_tiroir`,
  `lignes_vente`, `paiements` sont append-only : aucun UPDATE, aucun DELETE.
  Une correction = un mouvement inverse daté du jour.
- `ventes` : seules les colonnes d'annulation peuvent être renseignées, une seule fois.
- Aucun champ `quantite` mutable sur `articles`. La quantité est calculée (RG-10).
- Toute requête sur une table métier filtre par `tenant_id`.
- Toute opération de caisse est rattachée à une `session_caisse` ouverte.
- Identifiants : UUID v7 générés côté client, jamais d'auto-incrément.
- Aucune valeur métier en dur : TVA, devise, arrondis, seuils, mentions viennent de `parametres`.
- Aucune fonctionnalité métier ne dépend du réseau. L'UI de caisse lit la base locale,
  jamais l'API. Toute mutation écrit sa donnée **et** son événement `outbox`
  dans la même transaction.
- Les alertes sont calculées dans `domain`, côté caisse. Une notification n'est qu'un canal.
- La clôture de session : comptage saisi **avant** tout affichage du théorique (EF-U3-31).
- Montants en entiers FCFA ; quantités en millièmes d'unité de base ;
  CUMP en millièmes de FCFA ; taux en points de base (DEC-04). Jamais de flottant.
- Un vendeur ne voit jamais prix d'achat, CUMP, marge, CA cumulé ni valorisation (§2.2).
  Le contrôle d'accès du tableau de bord se fait dans l'API, et il est testé.
- Le mot « quincaillerie » n'apparaît dans aucun fichier de code.

## Architecture

- `packages/domain` : fonctions pures. Aucune dépendance à une base, à un framework UI
  ou au réseau.
- Toute nouvelle règle métier s'écrit d'abord dans `domain`, **tests d'abord**, puis l'UI.
- `packages/sync` : moteur d'outbox et interface `SyncTransport`. Aucun transport n'est
  requis pour que l'application fonctionne.
- `apps/proprietaire` est une application séparée de `apps/caisse`.

## Conventions

- TypeScript strict, aucun `any`.
- Validation Zod à toutes les frontières (API, import, lecture des paramètres).
- Interface en français.
- Commits conventionnels, une unité ou fonctionnalité par branche,
  identifiants d'exigence dans le message (ex. `feat(caisse): cloture a l'aveugle [EF-U3-31]`).
- Chaque décision d'architecture : un ADR dans `docs/adr/`.

## Avant de proposer du code

- Ne modifie jamais le schéma sans le signaler explicitement et sans migration réversible.
- Si une demande contredit un invariant ou une exigence, signale-le au lieu de contourner.
- Si une question ouverte (Q-xx) bloque la tâche, pose-la au lieu de supposer.
- Termine chaque tâche par : `pnpm typecheck && pnpm lint && pnpm test`.

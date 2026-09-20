# Conception fonctionnelle — U2 Socle (`u2-foundation`) — Questions

Unité : schéma et migrations, seed de démonstration, authentification PIN et rôles, paramètres typés, écriture transactionnelle + outbox, journal d'audit. Composants : Identity, Settings, TransactionalWriter, SensitiveDataGuard. Aucune règle de calcul métier (U3). Aucun écran de vente.

## Interaction Mode

Comment souhaitez-vous répondre aux questions de cette unité ?

- A. Guide me — une question à la fois
- B. I'll edit the file — je remplis le fichier moi-même
- C. Chat — on discute librement, vous consolidez ensuite

[Answer]: A

## Q1 — Emprise du schéma U2

Quelles tables métier le socle doit-il créer dès U2 (hors tables purement techniques de preuve U1) ?

- A. Identité (utilisateurs, rôles, sessions), paramètres, journal d'audit, outbox — et rien d'autre ; le catalogue et les ventes viennent plus tard
- B. Comme A, plus les tables catalogue (articles, unités, prix) sans quantités
- C. Comme B, plus les tables de caisse / ventes en squelette vide
- X. Other (please specify)

[Answer]: B

## Q2 — Authentification PIN

Comment le PIN doit-il être stocké et vérifié hors ligne (EF-U0-06) ?

- A. PBKDF2-SHA256, ≥ 310 000 itérations, sel par utilisateur, vérification locale uniquement — comme déjà décidé
- B. Autre dérivation / autre seuil d'itérations (préciser)
- X. Other (please specify)

[Answer]: A

## Q3 — Paramètres

Comment lire les paramètres métier (TVA, devise, seuils, mentions) ?

- A. Table `parametres` typée, validée Zod à la lecture, aucune valeur métier en dur dans le code
- B. Fichier de config local + table (préciser la priorité)
- X. Other (please specify)

[Answer]: A

## Q4 — Écriture transactionnelle et outbox

Toute mutation métier doit-elle écrire l'événement outbox dans la même transaction SQLite que la donnée ?

- A. Oui, toujours — invariant non négociable (CLAUDE.md)
- B. Oui pour les mutations synchronisables ; les écritures purement locales d'audit peuvent être séparées (préciser)
- X. Other (please specify)

[Answer]: A

## Q5 — Journal d'audit

Le journal d'audit U2 est-il append-only strict (aucune UPDATE/DELETE), avec correction = mouvement inverse ?

- A. Oui, strictement append-only comme les autres journaux
- B. Append-only avec colonnes d'annulation sur certaines lignes (préciser)
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Résumé de tes réponses :

- **Schéma** : identité + paramètres + audit + outbox **et** catalogue (articles, unités, prix) **sans** quantités ; pas de tables ventes/stock (Q1-B).
- **PIN** : PBKDF2-SHA256 ≥ 310 000 itérations, sel par utilisateur, vérification locale, blocage 5 échecs / 10 min (Q2-A).
- **Paramètres** : table typée, validation à la lecture, aucune valeur métier en dur (Q3-A).
- **Mutations** : donnée + audit + outbox dans la même transaction (Q4-A).
- **Audit** : append-only strict ; correction = nouvelle entrée (Q5-A).
- **Seed** : tenant + 3 utilisateurs + 200 articles ; portion « 30 jours de ventes » différée.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

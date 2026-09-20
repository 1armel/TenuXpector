# ADR 001 — Moteur de base locale chiffrée

- **Statut** : accepté
- **Date** : 2026-09-20
- **Unité** : `u1-pc-proof`
- **Exigences** : NFR8, NFR4, NFR17

## Contexte

La caisse doit fonctionner hors ligne avec une base locale chiffrée au repos.
Sous Electron / Windows, le moteur doit survivre à des coupures brutales
(WAL + synchronisation complète) et refuser une base en clair.

## Décision

Utiliser **`better-sqlite3-multiple-ciphers`** (SQLCipher) avec :

- `cipher = sqlcipher`
- `journal_mode = WAL`
- `synchronous = FULL`
- clé fournie uniquement via `TENU_DATABASE_KEY` (repli de développement non secret hors production)

## Conséquences

- Module natif à rebuilder pour Electron (`electron-rebuild`).
- Types du paquet incomplets côté `exports` : déclaration ambiante locale.
- Une base SQLite non chiffrée est refusée explicitement (`UnencryptedDatabaseError`).

## Alternatives rejetées

| Option | Motif de rejet |
|---|---|
| SQLite en clair + chiffrement fichier | Ne prouve pas le chiffrement au niveau page ; plus fragile sous WAL |
| `sql.js` | Pas de chiffrement natif durable ; perf insuffisante |
| LevelDB / autre | Hors du modèle relationnel retenu pour U2 |

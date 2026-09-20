# ADR 003 — Version d’Electron ciblée

- **Statut** : accepté
- **Date** : 2026-09-20
- **Unité** : `u1-pc-proof`
- **Exigences** : NFR8, NFR11

## Contexte

Le durcissement Electron (isolation de contexte, sandbox, pas de Node dans le
rendu) doit être posé dès P0/U1 : il n’est pas rattrapable après empaquetage.

## Décision

Cibler **Electron 44.x** avec **electron-vite 5.x** et React 19 pour le rendu.

Durcissement non négociable dès la première fenêtre :

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- CSP stricte, navigation et `window.open` refusés par défaut
- pont IPC minimal validé Zod des deux côtés

## Conséquences

- Rebuild natif de `better-sqlite3-multiple-ciphers` aligné sur la version ABI Electron.
- Les tests unitaires aliasent `electron` vers une doublure pour rester hors runtime.

## Alternatives rejetées

| Option | Motif de rejet |
|---|---|
| Electron 28 LTS ancien | ABI et correctifs sécurité trop en retard pour un greenfield |
| Tauri | Hors stack affirmée ; courbe d’apprentissage native différente |
| NW.js | Écosystème et durcissement moins matures pour ce projet |

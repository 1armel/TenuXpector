# Consignes de test — U1 preuve de concept PC (`u1-pc-proof`)

Stratégie active : `Comprehensive`. Dix à quinze tests par composant, unitaires, d'intégration et de bout en bout. Chaque fichier couvre le cas nominal et au moins deux cas d'erreur ou limites. Aucun test ne doit passer quel que soit le code.

## Outillage

| Usage | Outil | Configuration |
|---|---|---|
| Unitaire et intégration | Vitest | `vitest.config.ts` à la racine, projets par paquet |
| Bout en bout sur Electron | Playwright | `playwright.config.ts`, lanceur Electron |
| Couverture | `@vitest/coverage-v8` | seuils déclarés, jamais abaissés |

Aucun test de propriété (fast-check) dans cette unité : il n'y a pas encore de règle de calcul à éprouver. Il arrivera avec U3.

## Commandes de l'unité

Ces commandes ne visent **que** cette unité. Build and Test exécute les commandes de chaque unité ; une commande non restreinte relancerait toute la suite à chaque fois.

```bash
# Unitaires et intégration de l'unité
pnpm vitest run --dir apps/pc-proof --coverage

# Bout en bout de l'unité, sur Electron
pnpm playwright test tests/e2e/pc-proof.spec.ts

# Banc d'arrêts forcés (long, non inclus dans la commande courante)
pnpm vitest run tests/resilience/power-cut.spec.ts --testTimeout=600000
```

La commande unitaire est exécutable **avant** la première étape qui contient un test : l'étape 3 la met en place, l'étape 7 est la première à s'en servir.

## Seuils de couverture

| Périmètre | Lignes | Branches | Source |
|---|---|---|---|
| `apps/pc-proof` | 80 % | 80 % | plancher d'équipe pour tout paquet hors `domain` |
| `packages/domain` | 90 % | 90 % | NFR11 — ne s'applique pas encore, le paquet est vide |

Ces seuils sont déclarés dans la configuration. Ils ne sont jamais abaissés pour faire passer une étape. Si un seuil ne peut pas être tenu, l'écart est signalé, pas contourné.

Exclusions explicites, et aucune autre : fichiers de types (`*.d.ts`), fichiers générés, migrations, jeu de démonstration.

## Répartition attendue

| Composant | Fichier | Tests | Contenu |
|---|---|---|---|
| Coquille Electron | `main.spec.ts` | 10–12 | Démarrage ; `contextIsolation` actif ; `nodeIntegration` inactif ; navigation externe refusée ; ouverture de fenêtre refusée ; politique de sécurité de contenu présente ; fermeture propre |
| Pont IPC | `bridge.spec.ts` | 10–12 | Les trois canaux au cas nominal ; charge utile invalide rejetée par Zod ; canal inconnu rejeté ; charge trop grande rejetée ; réponse d'erreur typée, jamais une exception brute |
| Base chiffrée | `database.spec.ts` | 12–15 | Ouverture ; mauvaise clé refusée ; base non chiffrée refusée ; écriture et relecture ; transaction annulée ; migration aller ; migration retour ; UUID v7 conforme et croissant ; WAL actif ; fermeture puis réouverture |
| Impression | `printer.spec.ts` | 12–15 | Octets ESC/POS attendus ; format « 12 500 FCFA » ; date JJ/MM/AAAA ; fuseau `Africa/Douala` ; imprimante absente ; imprimante qui refuse ; coupure en cours ; **l'échec ne remonte jamais en exception à l'appelant** ; l'aperçu écran produit la même composition |
| Résistance | `power-cut.spec.ts` | 3–5 | 10 arrêts forcés ; aucune transaction validée perdue ; base non corrompue ; contrôle d'intégrité vert après réouverture |
| Bout en bout | `pc-proof.spec.ts` | 3–5 | Démarrer → ouvrir la base → écrire → imprimer → fermer ; échec d'impression sans blocage ; redémarrage après arrêt forcé |

## Doublures et données de test

- **La base n'est jamais doublée.** Les tests de base tournent sur un vrai fichier chiffré dans un répertoire temporaire, supprimé après coup. Une base en mémoire ne prouverait rien de ce que cette unité doit prouver.
- **L'imprimante est doublée** pour tout sauf la vérification physique finale : une doublure capture les octets envoyés et permet de simuler l'absence, le refus et la coupure. La sortie physique se vérifie à la main, une fois, et le résultat est consigné.
- **Aucun secret dans les tests.** La clé de chiffrement d'essai vient d'une variable d'environnement avec une valeur de repli explicite, jamais d'une constante ressemblant à une vraie clé. [NFR8]
- **Les horodatages sont injectés**, jamais lus de l'horloge système dans une assertion. Un test qui dépend de l'heure réelle est un test instable.

## Ce qu'un test ne doit pas faire ici

- Vérifier une règle métier : il n'y en a aucune dans cette unité.
- Passer quel que soit le code (`expect(true).toBe(true)` et ses variantes).
- Dépendre du matériel pour la suite automatisée : seule la vérification physique finale en dépend, et elle est manuelle et consignée.

## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-09-21T09:46:16Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Minor | packages/domain/src/types.ts > interface AlertContext > field `currentQuantityBase` | Le champ `currentQuantityBase?: QuantityBase` est déclaré dans `AlertContext` mais n'est jamais lu dans `alert-engine.ts`. Les fonctions `evaluerAlertes` et `evaluerAlertesPeriodiques` utilisent `event.payload.quantityBase` (pour `stock_changed`) et ignorent ce champ de contexte. Ce champ mort crée une confusion pour les appelants aval (U5/U6), qui pourraient croire qu'il suffit de le renseigner dans le contexte pour déclencher AL-09. | Soit supprimer `currentQuantityBase` de `AlertContext`, soit l'utiliser dans l'implémentation à la place du champ d'événement, soit ajouter un commentaire JSDoc expliquant explicitement pourquoi ce champ est réservé à un usage futur. | New |
| R-02 | Minor | packages/domain/src/alert-engine.ts > case 'stock_changed' > AL-18 guard (`q >= 0`) | Le garde `q >= 0` empêche AL-18 de se déclencher quand le stock est négatif, même si un `alertStockThreshold` est fourni et que Q < threshold. La spec fonctionnelle (WF6) indique « AL-18 `stock_changed` selon payload » sans exclure explicitement le cas Q < 0. Ce choix de conception (AL-09 prime, AL-18 silencieux) n'est pas documenté dans la spec, dans le plan ni dans les tests. Aucun test ne couvre Q < 0 + `alertStockThreshold` présent. | Documenter explicitement le choix (AL-09 et AL-18 mutuellement exclusifs quand Q < 0) dans un commentaire inline et dans la spec fonctionnelle ; ajouter un test couvrant ce cas limite (Q < 0, threshold défini → attente : AL-09 seul, pas AL-18). | New |
| R-03 | Minor | vendor/fast-check-4.10.2.tgz + pnpm-lock.yaml > résolution de `pure-rand` | `fast-check` est vendorisé dans `vendor/fast-check-4.10.2.tgz` et `vendor/pure-rand-8.4.2.tgz` est aussi présent. Cependant, le lockfile montre que la dépendance transitive de `fast-check` vers `pure-rand` est résolue en `pure-rand@8.4.2` depuis le registre npm (entrée `pure-rand@8.4.2: {}` distincte de `pure-rand@file:vendor/pure-rand-8.4.2.tgz`). Un `pnpm install --frozen-lockfile` dans un environnement sans accès au registre npm pourrait échouer à résoudre `pure-rand@8.4.2` comme dépendance transitive de `fast-check`, malgré la présence du tarball local. | Vérifier que `pure-rand` est résolu exclusivement depuis `vendor/` y compris comme dépendance de `fast-check` (ex. via `pnpm overrides` ou en repackageant le tarball `fast-check` avec une référence `file:`). Documenter la décision dans `code-summary.md` si l'accès registre est toujours garanti en CI. | New |
| R-04 | Minor | aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/construction/u3-domain/code-generation/code-summary.md > section Écarts | La méthode `custom` du projet exige un Red visible avant chaque implémentation pour toutes les règles de `packages/domain`. Le résumé reconnaît honnêtement : « modules écrits en lots tests+implémentation ; […] Pas de Red file-par-file documenté pour chaque Étape 3–11 ». La traçabilité des cycles Red-Green-Refactor au niveau des étapes 3 à 11 n'est pas auditable. La couverture élevée (98 %+) compense fonctionnellement, mais l'engagement de la pratique ne peut être vérifié. | Aucune correction bloquante requise pour ce Bolt (couverture satisfaite). Pour les prochains Bolts, documenter a minima un indicateur de Red par fichier (ex. sortie CI du premier run échoué) pour respecter l'invariant d'audit de la méthode. | New |

### Validation Tool Results

| Outil | Résultat | Interprétation |
|---|---|---|
| `pnpm test:domain` | PASS — 74 tests verts ; 98,24 % lignes, 94,76 % branches | Seuils 90 % lignes et branches respectés (ENF-11). Commande exacte conforme à `unit-test-instructions.md`. |
| `pnpm typecheck` | PASS | Aucun erreur TypeScript strict sur les 4 tsconfigs. |
| `pnpm lint` | PASS | Aucune violation ESLint. Frontière domaine pure (BR9.1) respectée. |
| Traceability targets | PASS | Tous les chemins `target` de `traceability.json` existent sur disque. |
| Inspection DEC-04 | PASS | Tous les calculs utilisent `arrondir(numerateur, denominateur)` avec des entiers ; aucun flottant détecté dans `src/`. |
| Inspection BR5.3 | PASS | `credit` compte dans Σ pour `changeDue` ; plafond rendu = `sumByMode(especes)` seul. Tests couvrent : crédit ∈ Σ, rendu ≤ espèces, refus CHANGE_EXCEEDS_CASH. |
| Inspection AL-10 | PASS | `case 'cash_outflow'` dans `evaluerAlertes` est un no-op documenté (commentaire R-09) ; AL-10 émis uniquement par `evaluerAlertesPeriodiques` via l'historique glissant. |
| Inspection BR9.1 | PASS | `packages/domain/package.json` n'a aucune dépendance runtime ; aucun import de base/UI/réseau dans `src/`. |

### Summary

Le code livré est correct, pur, et bien couvert (98 %+ lignes, 94 %+ branches). Les quatre points DEC-04 entiers, BR5.3 crédit, AL-10 hors `cash_outflow`, et BR9.1 pureté sont tous fidèlement implémentés et testés. Les quatre findings sont tous Mineurs : un champ de contexte mort (R-01), un comportement AL-18/AL-09 non documenté (R-02), une résolution transitive `pure-rand` potentiellement dépendante du registre npm (R-03), et un écart de cadence TDD honnêtement reconnu (R-04). Aucun n'est bloquant. Un développeur peut implémenter les unités aval à partir de ces artefacts sans avoir à questionner l'architecte sur les points couverts.

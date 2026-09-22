# Performance Validation — Questions

> Cibles figées : **ENF-02** recherche p95 < 200 ms / 10k articles ; **ENF-16** 50 fiches / 15 min (opérateur). Différées depuis Build and Test. Pas d’observabilité cloud. `next_stage` moteur : fin de parcours planifié après cette étape (ou suite selon état).

## Q1. Moment de mesure ENF-02 (recherche)

Quand / comment mesurer ENF-02 ?

- A. **Reporter à J1** : plan + matrice Unverified maintenant ; seed 10k + probe chrono sur PC cible à J1 (aligne practices) — recommandé sous HOLD
- B. Mesurer maintenant sur ENV-DEV avec seed démo actuel (hors 10k — résultat indicatif seulement)
- C. Écrire et lancer maintenant un banc seed 10k + probe recherche sur ENV-DEV
- X. Other (please specify)

[Answer]: B

## Q2. Moment de mesure ENF-16 (saisie)

Quand mesurer ENF-16 ?

- A. **Reporter à J1** : chronométrage opérateur (médiane 3 essais) hors Playwright — recommandé
- B. Tenter un essai opérateur maintenant (15 min) et consigner le résultat
- X. Other (please specify)

[Answer]: B

## Q3. Charge / profil trafic

Profil de charge à documenter dans le plan ?

- A. Profil caisse : 1 opérateur, bursts recherche pendant vente ; pas de charge multi-tenant cloud — recommandé
- B. Simuler N clients concurrents type HTTP
- X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

**Q1-B.** Probe recherche **indicatif** maintenant sur seed démo ENV-DEV (pas 10k) → consigner latences ; vs cible ENF-02 = **indicative / Not Met** pour le critère 10k tant que seed volumineux absent.

**Q2-B.** Un essai opérateur ENF-16 **maintenant** : après génération du plan, chronométrer (ou te faire rapporter) **une** série 50 fiches / 15 min ; médiane 3 essais reste due à J1 si un seul essai est fait ici.

**Q3-A.** Profil charge = 1 opérateur caisse, bursts recherche ; pas de load HTTP multi-client.

Artefacts : `load-test-plan.md`, `test-results.md`, `nfr-validation-matrix.md`.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

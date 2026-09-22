## Review

**Verdict:** READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-09-21T21:14:58Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/260921-u4-catalog/inception/refined-mockups/mockups.md > Écran C1 — Fiche (boutons) | L'action « Imprimer étiquette » est absente de la fiche article. EF-U2-04 et le scope-document (FR3.8, Must) requièrent la génération d'un code_interne court et d'une étiquette imprimable. La maquette montre Enregistrer, Dupliquer, Désactiver mais aucun bouton d'impression d'étiquette. Le mapping composants ne liste pas non plus de composant d'impression. Un développeur ne sait pas quand ni comment déclencher ce flux. | Ajouter un bouton « Imprimer étiquette » (visible pour tout rôle ayant accès à la fiche) ; préciser le contexte de déclenchement (à la création initiale si code_interne généré, ou à la demande sur une fiche existante) et le rendu (impression USB déjà livrée en U3, ou autre). | New |
| R-02 | Major | aidlc/spaces/default/intents/260921-u4-catalog/inception/refined-mockups/accessibility-checklist.md > Critères d'acceptation UX, item 1 | Le critère d'acceptation UX cite « 5 articles en série sans quitter le clavier » pour référencer ENF-16, alors qu'ENF-16 fixe la barre à 50 articles minimum en moins de 15 min. Un testeur QA lirait ce critère comme « 5 articles = conforme ENF-16 », ce qui est faux. | Corriger le critère : « Un propriétaire peut créer 50 articles au minimum requis (EF-U2-06) en moins de 15 min sans quitter le clavier (ENF-16) ; chronométrage médiane de 3 essais sur la cible réelle ». | New |
| R-03 | Minor | aidlc/spaces/default/intents/260921-u4-catalog/inception/refined-mockups/mockups.md > Écran C3/C4 — Assistants import et photo, Étape 1 | EF-U2-03 impose que le modèle de fichier soit fourni. L'assistant import ne montre aucune action « Télécharger le modèle ». | Ajouter dans l'étape 1 une action secondaire « Télécharger le modèle CSV/Excel ». | New |
| R-04 | Minor | aidlc/spaces/default/intents/260921-u4-catalog/inception/refined-mockups/mockups.md > Écran C3/C4 — Étape 3 Prévisualisation | FR3.4 / EF-U2-03 requiert un réimport sans doublon. Les maquettes ne montrent pas comment l'interface signale les lignes en doublon lors d'un second import. | Ajouter dans la prévisualisation un statut « Doublon » (en plus de OK / Avertissement / Erreur) et décrire le comportement retenu. | New |
| R-05 | Minor | aidlc/spaces/default/intents/260921-u4-catalog/inception/refined-mockups/mockups.md > Écran Articles à compléter | Cet écran n'a aucun état défini (chargement, vide, erreur). | Ajouter une table d'états : chargement, vide (« Tous les articles sont complets. »), erreur. | New |

### Summary

Les maquettes sont globalement solides et implémentables : navigation par rôle claire, masquage vendeur CT-09 au niveau DOM, wizard import/photo partagé, clavier-first et WCAG 2.1 AA. Deux points majeurs à peser avant d'approuver : l'étiquette imprimable (EF-U2-04) absente des maquettes, et le critère ENF-16 sous-calibré (5 articles au lieu de 50). Les trois points mineurs peuvent être traités en revue de Bolt si le propriétaire approuve maintenant.

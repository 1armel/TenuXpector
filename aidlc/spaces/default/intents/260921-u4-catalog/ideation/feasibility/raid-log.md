# Registre RAID — U4 Catalogue et saisie

Risques, hypothèses, problèmes et dépendances de **cette** unité. Entrées : `intent-statement.md`, `constraint-register.md`, `feasibility-questions.md`.

Échelle : probabilité et impact en **Faible / Moyen / Élevé**.

## Risques

| ID | Risque | Probabilité | Impact | Traitement |
|---|---|---|---|---|
| R-01 | Un service photo est figé avant d’avoir vu un spécimen du registre, et des prix d’achat partent chez un tiers | Moyenne | Élevé | Atténuer : interdiction d’envoi tant que Q5 n’est pas tranchée sur un spécimen (CR-02). |
| R-02 | La reconnaissance de texte rate l’écriture du registre (manuscrit, photo floue, plusieurs colonnes) | Moyenne | Moyen | Atténuer : écran de vérification obligatoire avant import ; saisie clavier et import fichier restent des chemins complets. |
| R-03 | L’import générique est trop tardif ou trop pauvre pour un fichier réel très irrégulier | Faible | Moyen | Atténuer : mapping de colonnes à l’écran dès le premier fichier ; une ligne en erreur n’empêche pas les autres. |
| R-04 | Le volume (> 3 000) rend la saisie clavier trop lente malgré l’ergonomie visée | Moyenne | Moyen | Atténuer : import fichier + photo comme accélérateurs ; mesurer la cible 50 articles / 15 min sur la démo. |
| R-05 | Un appel HTTPS pour l’OCR est pris pour une dépendance métier au réseau | Faible | Élevé | Atténuer : l’appel n’existe que sur l’import photo, jamais sur la vente ; la caisse reste utilisable hors ligne. |
| R-06 | Construire un moteur de reconnaissance maison consomme U4 sans livrer le catalogue | Moyenne | Élevé | Éviter : outil ou service connu seulement (Q7). |

## Hypothèses

| ID | Hypothèse | À vérifier par | Échéance |
|---|---|---|---|
| A-01 | Un spécimen (quelques pages) du registre peut être obtenu avant de figer l’adaptateur photo | Développeur, avec le propriétaire | Avant la fin de la preuve de concept OCR |
| A-02 | Un outil ou service d’extraction de texte déjà connu suffit pour un usage ponctuel sur images copiées sur le PC | Développeur | Pendant la preuve de concept |
| A-03 | Le volume réel dépasse 3 000 références | Propriétaire (ordre de grandeur) | Avant de figer les tests d’ergonomie d’import |
| A-04 | Les données de démonstration suffisent pour la démo de fin d’unité, sans le registre complet | Développeur | Démo U4 |

Ces hypothèses restent des hypothèses : elles ne sont pas des faits.

## Problèmes

| ID | Problème | Action |
|---|---|---|
| I-01 | On ne sait pas encore si le registre papier montre des prix d’achat | Bloquer tout envoi d’image à un tiers jusqu’au spécimen (CR-02) |

## Dépendances

| ID | Dépendance | Bloque | Responsable |
|---|---|---|---|
| D-01 | Spécimen du registre (pages) | Décision finale du moyen de reconnaissance | Propriétaire / développeur |
| D-02 | Socle u1–u3 déjà livré (schéma articles, caisse) | Toute l’UI catalogue | Déjà livré — pas un bloqueur |
| D-03 | Jeu de données de démonstration catalogue | Démo de fin d’unité | Développeur |

## Assumptions & Open Questions

None.

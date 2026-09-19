# Carte des exigences par unité — TenuXpector V1

Aucune histoire utilisateur n'a été produite : l'étape correspondante est écartée du plan parce que les exigences portent déjà leurs critères d'acceptation. La carte rattache donc les **exigences fonctionnelles** `FR` de `requirements.md` à leur unité.

## Couverture par unité

| Unité | Dossier | Exigences couvertes | Nombre |
|---|---|---|---|
| U1 | `u1-pc-proof` | Aucune exigence fonctionnelle : l'unité prouve NFR4, NFR8, NFR17 et prépare NFR15 | 0 |
| U2 | `u2-foundation` | FR1.2, FR1.3, FR1.4, FR1.5, FR1.6, FR1.7, FR1.8, FR1.9, FR4.8, FR6.1, FR7.1 | 11 |
| U3 | `u3-domain` | FR2.1 à FR2.10, FR4.16 | 11 |
| U4 | `u4-catalog` | FR3.1 à FR3.8 | 8 |
| U5 | `u5-register` | FR4.1 à FR4.7, FR4.9 à FR4.15 | 14 |
| U6 | `u6-printing` | FR5.1 à FR5.7 | 7 |
| U7 | `u7-audit-alerts` | FR6.2 à FR6.6 | 5 |
| U8 | `u8-sync` | FR7.2, FR7.3, FR7.4, FR7.5 | 4 |
| U9 | `u9-procurement` | FR8.1 à FR8.6 | 6 |
| U10 | `u10-credit` | FR9.1 à FR9.7 | 7 |
| U11 | `u11-invoicing` | FR10.1 à FR10.6 | 6 |
| U12 | `u12-desktop-packaging` | Aucune exigence fonctionnelle : porte NFR15 et NFR17 sur la cible PC | 0 |
| U13 | `u13-android-packaging` | Aucune exigence fonctionnelle : porte NFR15 et NFR17 sur la cible tablette | 0 |
| U14 | `u14-owner-app` | FR7.6, FR7.7, FR1.1 (structure des applications) | 3 |

**Total : 82 exigences fonctionnelles, toutes rattachées.**

## Exigences transverses

Certaines exigences se construisent dans une unité mais sont **vérifiées** dans une autre. Elles restent rattachées à l'unité qui les construit, pour qu'il n'y ait qu'un seul propriétaire.

| Exigence | Construite dans | Aussi vérifiée dans | Pourquoi |
|---|---|---|---|
| FR1.3 — journaux à ajout seul | U2 | U5, U9, U10 | Chaque unité qui écrit doit prouver qu'elle ne modifie rien |
| FR1.4 — isolation par tenant | U2 | U8, U14 | Le serveur et l'application du propriétaire sont les plus exposés |
| FR4.8 — écriture atomique | U2 | U5 | L'invariant se prouve sur une vente réelle, par arrêt forcé |
| FR4.14 — masquage par rôle | U5 | U7, U14 | La règle vit dans le socle, elle se vérifie partout où l'on affiche |
| FR6.1 — journal d'audit | U2 | U5, U7, U9, U10, U11 | Toute action sensible écrit son entrée |
| FR7.1 — événement de synchronisation | U2 | U8 | Écrit dès le socle, transporté par la synchronisation |

## Ordre interne à chaque unité

Au sein d'une unité, les exigences se construisent dans l'ordre de leurs dépendances de données, et jamais l'interface avant la règle métier. Pour les unités qui touchent au domaine, la règle est écrite **tests d'abord**.

| Unité | Ordre interne |
|---|---|
| U2 | Schéma et migrations → identité et PIN → paramètres → écriture transactionnelle → masquage → jeu de démonstration |
| U3 | Stock → coût moyen → tarification → totaux et paiements → espèces et écart → alertes → rapport |
| U4 | Fiche article et unités → recherche → saisie rapide → import de fichier → saisie par photo |
| U5 | Session et ouverture → ajout d'articles → encaissement → annulation → mouvements d'espèces → clôture |
| U6 | Adaptateur et aperçu → ticket de vente → ticket de clôture → file et duplicata → tiroir |
| U7 | Branchement des règles par événement → écran des alertes → règles glissantes → rapport → comparaison des opérateurs |
| U8 | File et curseurs → transport fichier → transport serveur → serveur et idempotence → détection des trous |
| U9 | Fournisseur → réception → mouvements de stock → réception inverse |
| U10 | Client et plafond → paiement à crédit → dépassement et dérogation → remboursement → relevé |
| U11 | Numérotation → composition et mentions → sortie thermique → sortie PDF → duplicata |
| U14 | Accès et appareil de confiance → écrans de lecture → fraîcheur des données → journalisation des consultations |

## Vérification de couverture

- Chaque exigence fonctionnelle est rattachée à exactement une unité propriétaire.
- Trois unités — la preuve de concept et les deux empaquetages — ne portent aucune exigence fonctionnelle : elles portent des exigences non fonctionnelles, ce qui est normal pour leur nature.
- Aucune unité fonctionnelle n'est vide.

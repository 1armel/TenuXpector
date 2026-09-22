# Registre des contraintes — U4 Catalogue et saisie

Entrées : `intent-statement.md`, `feasibility-questions.md`.

Une contrainte est une limite imposée, que la conception de U4 doit respecter. Ce qui est incertain est suivi dans `raid-log.md`.

## Contraintes techniques

| ID | Contrainte | Source | Conséquence de conception |
|---|---|---|---|
| CT-01 | L’interface catalogue est embarquée dans la caisse, sur le socle déjà livré ; pas une application propriétaire séparée | `intent-statement.md` | Un seul écran dans l’app de caisse ; réutiliser le schéma articles / unités de vente. |
| CT-02 | Aucun autre système à intégrer que cette caisse | Faisabilité Q1 | Pas de connecteur fournisseur, pas d’API tierce obligatoire pour vendre. |
| CT-03 | Aucune fonctionnalité métier de caisse ne dépend du réseau | `intent-statement.md`, règles projet | Un service photo, s’il est retenu, ne concerne que l’import initial, jamais le parcours de vente. |
| CT-04 | Photo du registre : fichier image déjà sur le PC | Faisabilité Q3 | Parcours « ouvrir un fichier », pas webcam obligatoire. |
| CT-05 | Import fichier : format encore inconnu | Faisabilité Q6 | Mapping des colonnes à l’écran ; ne pas câbler Excel ou CSV comme unique format. |
| CT-06 | Reconnaissance de texte : outil ou service connu, pas un moteur maison | Faisabilité Q7 | Interface d’extraction remplaçable ; preuve de concept des deux voies avant de figer. |
| CT-07 | Pas de compte AWS ni d’hébergement cloud pour U4 | Faisabilité Q9 | Tout local, sauf éventuellement un appel HTTPS ponctuel si Q2 le justifie après la preuve de concept. |
| CT-08 | Catalogue à dimensionner au-delà de 3 000 références | Faisabilité Q4 | L’ergonomie d’import et de saisie clavier doit tenir ce volume. |
| CT-09 | Un vendeur ne voit jamais prix d’achat, CUMP, marge, CA cumulé ni valorisation | `intent-statement.md` | Masquage dans l’UI catalogue selon le rôle ; s’applique aussi à l’écran de vérification photo. |

## Contraintes organisationnelles

| ID | Contrainte | Source | Conséquence |
|---|---|---|---|
| CO-01 | Le développeur décide de l’ordre technique ; le propriétaire tranche le métier quand un arbitrage remonte | `intent-statement.md` | Le choix OCR final remonte au propriétaire s’il change ce qui est utilisable. |
| CO-02 | Aucun bloqueur de calendrier pour U4 | Faisabilité Q8 | On avance tout de suite. |
| CO-03 | Démo hors boutique sur données de démonstration ; registre réel plus tard | Faisabilité Q8, `intent-statement.md` | Le jeu de démo catalogue doit exister pour la démo de fin d’unité. |
| CO-04 | Preuve de concept des deux voies OCR, puis décision avant de figer l’adaptateur | Faisabilité Q2, `intent-statement.md` | Ne pas livrer un adaptateur unique dès le premier écran photo. |

## Contraintes réglementaires

| ID | Contrainte | Source | Conséquence |
|---|---|---|---|
| CR-01 | Les prix d’achat ne sont jamais transmis à un service tiers | `intent-statement.md` | Recadrage, masquage, ou reconnaissance sur l’appareil si le spécimen montre des coûts. |
| CR-02 | Contenu réel du registre (prix d’achat ou non) inconnu tant qu’un spécimen n’a pas été vu | Faisabilité Q5 | Interdiction d’envoyer une photo à un tiers avant cette vérification. |
| CR-03 | U4 ne crée pas de traitement de données clients ni de paiement carte | Faisabilité (périmètre unité) | PCI-DSS et droits des personnes sur le crédit **hors de cette unité**. |

## Assumptions & Open Questions

None.

# Registre des contraintes — TenuXpector

Entrées : `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`, `docs/exigences-tenuxpector.md`, `feasibility-questions.md`.

Une contrainte est une limite imposée, que la conception doit respecter. Ce qui est incertain est suivi dans `raid-log.md`.

## Contraintes techniques

| ID | Contrainte | Source | Conséquence de conception |
|---|---|---|---|
| CT-01 | Aucune fonctionnalité métier ne dépend du réseau | `docs/exigences-tenuxpector.md` §1.1, `CLAUDE.md` | La caisse lit et écrit uniquement sa base locale ; le serveur est un canal de synchronisation. |
| CT-02 | La première version tourne sur PC (Electron) | Faisabilité Q6, Q2 | Preuve de concept et empaquetage sur Windows d'abord. |
| CT-03 | La tablette Android (Capacitor) suit, avec parité fonctionnelle | `docs/exigences-tenuxpector.md` §1.4, ENF-15 | Code métier et interface partagés ; seuls les adaptateurs diffèrent. |
| CT-04 | Pas de lecteur de codes-barres | `docs/exigences-tenuxpector.md` DEC-11 | Recherche texte et code interne comme chemins de saisie. |
| CT-05 | Imprimante thermique 80 mm en USB, pilotée en ESC/POS | `docs/exigences-tenuxpector.md` DEC-11 | Adaptateur remplaçable ; une imprimante absente ne bloque jamais une vente. |
| CT-06 | Coupures de courant à tout instant | `docs/exigences-tenuxpector.md` ENF-04, ENF-17 | Transactions atomiques ; onduleur requis sur le poste fixe. |
| CT-07 | Montants, quantités et taux en entiers, jamais en flottant | `docs/exigences-tenuxpector.md` DEC-04 | Unités de stockage en millièmes et points de base. |
| CT-08 | Journaux à ajout seul, aucune mise à jour ni suppression | `CLAUDE.md` | Correction par mouvement inverse daté du jour. |
| CT-09 | Identifiants UUID v7 générés sur l'appareil | `CLAUDE.md` | Aucune séquence serveur. |
| CT-10 | Serveur privé virtuel pour la synchronisation seulement | Faisabilité Q6 | Aucun service métier côté serveur n'est requis pour vendre. |

## Contraintes organisationnelles

| ID | Contrainte | Source | Conséquence |
|---|---|---|---|
| CO-01 | Le développeur décide seul, le propriétaire est consulté | `intent-statement.md` (cadrage Q7) | Les arbitrages remontent au développeur. |
| CO-02 | Aucune échéance ferme ; le 30/09/2026 est un souhait | Faisabilité Q3, Q4 | Planification par jalons démontrables, pas par date. |
| CO-03 | Le budget matériel et hébergement n'est pas contraignant | Faisabilité Q5 | Le choix se fait sur la qualité, pas sur le prix minimal. |
| CO-04 | Tests d'abord hors boutique, avec des données de démonstration | Faisabilité Q10 | Le jeu de démonstration (EF-U0-07) doit exister tôt. |
| CO-05 | Le registre des produits n'est fourni qu'après la livraison | `intent-statement.md` (cadrage Q11) | La saisie du catalogue ne doit jamais bloquer la mise en service. |
| CO-06 | La boutique d'abord quand elle s'oppose au produit revendable | `intent-statement.md` (cadrage Q14) | Les pratiques réelles de la boutique priment. |

## Contraintes réglementaires

| ID | Contrainte | Source | Conséquence |
|---|---|---|---|
| CR-01 | Régime de l'impôt général synthétique : pas de TVA | Faisabilité Q8, `docs/exigences-tenuxpector.md` DEC-10 | `tva.applicable = false` ; facture A4 simple. |
| CR-02 | Données des clients à crédit limitées au nom et au téléphone | Faisabilité Q9 | Aucun autre champ personnel dans le modèle client. |
| CR-03 | Protection des données personnelles au Cameroun | Faisabilité Q9 (loi adoptée fin 2024, portée à vérifier) | À vérifier avant la mise en service du crédit. |
| CR-04 | Données synchronisées vers un serveur dans l'Union européenne | `docs/exigences-tenuxpector.md` §1.4 | Obligations éventuelles liées à l'hébergement européen, à vérifier. |
| CR-05 | Prix d'achat, coût moyen et marge cachés aux vendeurs | `docs/exigences-tenuxpector.md` §2.2 | Contrôle d'accès dans l'API et la couche de lecture, testé ; s'applique aussi à la saisie par photo. |

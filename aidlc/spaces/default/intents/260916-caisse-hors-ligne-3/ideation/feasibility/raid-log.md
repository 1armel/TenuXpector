# Registre RAID — TenuXpector

Risques, hypothèses, problèmes et dépendances identifiés à la faisabilité. Entrées : `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`, `constraint-register.md`, `feasibility-questions.md`.

Échelle : probabilité et impact en **Faible / Moyen / Élevé**.

## Risques

| ID | Risque | Probabilité | Impact | Traitement |
|---|---|---|---|---|
| R-01 | L'approvisionnement, le crédit et la facture A4 sont construits sans exigences écrites, puis refaits | Élevée | Élevé | Atténuer : rédiger leurs exigences avant leurs unités (dépendance D-01). |
| R-02 | Les photos du registre transmettent les prix d'achat à un service tiers | Moyenne | Moyen | Atténuer : recadrer sur désignations et prix de vente ; prix d'achat saisis à la main. |
| R-03 | Le module de chiffrement SQLite ne se compile pas ou se comporte mal sous Electron et Windows | Moyenne | Élevé | Atténuer : premier point de la preuve de concept. |
| R-04 | L'imprimante thermique USB n'est pas reconnue par le pilote Windows | Moyenne | Moyen | Atténuer : tester le modèle réel en preuve de concept ; l'aperçu à l'écran (EF-U4-05) couvre les démonstrations. |
| R-05 | La plateforme de l'application du propriétaire reste indécise jusqu'à la synchronisation | Moyenne | Moyen | Atténuer : décision avant U6 (dépendance D-04). |
| R-06 | La capacité de construction est inconnue ; toute date est illusoire | Élevée | Moyen | Accepter : planifier par jalons démontrables. |
| R-07 | Le périmètre continue de grandir au nom de « tout digitaliser » | Moyenne | Élevé | Atténuer : toute nouvelle activité passe par une exigence écrite avant d'entrer dans une unité. |
| R-08 | Les outils AI-DLC fonctionnent mal dans l'extension VS Code (hooks inactifs, arguments accentués tronqués) | Élevée | Faible | Contourné : réglage local et appel direct du binaire ; à surveiller. |

## Hypothèses

| ID | Hypothèse | À vérifier par | Échéance |
|---|---|---|---|
| A-01 | L'entreprise relève bien de l'impôt général synthétique | Le propriétaire | Avant la mise en service de la facture A4 |
| A-02 | Ton PC est représentatif du poste de caisse qui sera utilisé | Le développeur | Avant la preuve de concept |
| A-03 | Un service de reconnaissance de texte adapté existe pour le registre manuscrit ou imprimé | Le développeur | Avant la saisie initiale du catalogue |
| A-04 | La loi camerounaise sur les données personnelles n'impose rien d'incompatible avec un stockage nom et téléphone | Le développeur | Avant la mise en service du crédit |

## Problèmes

| ID | Problème | Action |
|---|---|---|
| I-01 | `docs/exigences-tenuxpector.md` limite encore la V1 aux unités U0 à U6 (§1.2) et exclut l'approvisionnement et le crédit (§1.3), contrairement à la déclaration d'intention | Mettre le document à jour à la définition du périmètre |
| I-02 | Le document (DEC-02, §1.4) prévoit les deux cibles dès le départ, alors que la faisabilité retient le PC d'abord | Mettre le document à jour à la définition du périmètre |
| I-03 | La règle de passage unité par unité (§11) contredit la livraison « tout d'un coup » souhaitée au cadrage | Trancher à la définition du périmètre |

## Dépendances

| ID | Dépendance | Bloque | Responsable |
|---|---|---|---|
| D-01 | Exigences détaillées de l'approvisionnement, du crédit et de la facture A4 | Leurs unités de construction | Le développeur |
| D-02 | Choix du service de reconnaissance de texte | Saisie initiale du catalogue | Le développeur |
| D-03 | Choix du fournisseur de serveur privé virtuel | Synchronisation (U6) | Le développeur |
| D-04 | Plateforme de l'application du propriétaire | Tableau de bord (U6) | Le développeur |
| D-05 | Imprimante thermique USB disponible | Preuve de concept d'impression | Le développeur |

# Document de périmètre — TenuXpector V1

Entrées : `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/feasibility/feasibility-assessment.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/feasibility/constraint-register.md`, et les réponses confirmées de `scope-definition-questions.md`.

## Frontière de la V1

### Dans le périmètre

| Domaine | Contenu | Priorité | Origine |
|---|---|---|---|
| Preuve de concept sur PC | Base locale chiffrée, impression thermique USB, survie à une coupure de courant | Must | Faisabilité, condition 2 |
| Socle (U0) | Monorepo, schéma, migrations, jeu de démonstration, PIN, rôles | Must | Exigences §1.2 |
| Domaine (U1) | Stock, coût moyen pondéré, tarification, marges, arithmétique entière | Must | Exigences §1.2 |
| Catalogue et saisie rapide (U2) | Fiche article, recherche, saisie rapide à grand volume, import initial | Must | Exigences §1.2 ; périmètre Q1 |
| Caisse hors ligne (U3) | Session, vente, encaissement espèces et mobile money, clôture à l'aveugle | Must | Exigences §1.2 ; périmètre Q1 |
| Impression (U4) | Ticket thermique 80 mm, ticket de clôture | Must | Exigences §1.2 ; périmètre Q1 |
| Audit, alertes, rapport (U5) | Journal d'audit, règles d'alerte anti-vol, rapport de clôture | Must | Intention : rendre chaque écart imputable |
| Synchronisation et application du propriétaire (U6) | File d'événements, serveur privé virtuel, application installée sur téléphone | Must | Périmètre Q2 |
| Approvisionnement (U7) | Fournisseurs, réceptions de marchandise, entrées de stock au coût réel | Should | Intention (cadrage Q9) ; périmètre Q2 |
| Crédit client (U8) | Clients limités au nom et au téléphone, ventes à crédit, remboursements, soldes | Should | Intention (cadrage Q9) ; faisabilité Q9 |
| Facture A4 (U10) | Facture simple, sans TVA, régime de l'impôt général synthétique | Should | Intention (cadrage Q12) ; faisabilité Q8 |

**Must** : indispensable à la mise en service. **Should** : en V1, construit après les « Must ».

### Hors du périmètre V1

| Élément | Raison |
|---|---|
| Inventaires tournants (U9) | Non retenu au cadrage |
| Console multi-client et accueil de nouveaux clients (U11) | Revente future ; la boutique d'abord |
| Intégration par API des opérateurs de mobile money | Référence de transaction saisie à la main |
| Facturation électronique DGI | Régime de l'impôt général synthétique, sans TVA |
| Plusieurs caisses dans un même magasin | Hors besoin du premier client |
| Inscription en ligne, facturation SaaS | Revente future |

### À confirmer

| Élément | Question |
|---|---|
| Tablette Android (Capacitor) | Le PC vient d'abord (faisabilité). La tablette fait-elle partie de la livraison V1, ou vient-elle après l'installation en boutique ? |

## Changements de frontière par rapport à `docs/exigences-tenuxpector.md`

Ces trois décisions contredisent le document d'exigences. Elles seront reportées dans le document pendant l'analyse des exigences (périmètre Q5).

| Problème (registre RAID) | Document actuel | Décision |
|---|---|---|
| I-01 | La V1 se limite aux unités U0 à U6 (§1.2) ; achats et crédit exclus (§1.3) | La V1 inclut aussi l'approvisionnement (U7), le crédit client (U8) et la facture A4 (U10) |
| I-02 | Les deux cibles dès le départ (DEC-02, §1.4) | Le PC d'abord ; la tablette ensuite |
| I-03 | Une unité ne démarre qu'après l'usage réel de la précédente en boutique (§11) | Règle retirée : livraison d'un coup après tests hors boutique (périmètre Q4) |

## Jalons

| Jalon | Contenu | Critère de fin | Lieu |
|---|---|---|---|
| J0 — Preuve de concept | Preuve de concept sur PC | Base chiffrée qui s'ouvre et survit à 10 coupures forcées ; un ticket sort sur l'imprimante USB | Ton PC |
| J1 — Caisse démontrable | U0, U1, U2, U3, U4 | Une session complète — ouverture, ventes, encaissements, clôture à l'aveugle, ticket — sur un catalogue saisi rapidement | Ton PC, données de démonstration |
| J2 — Contrôle et suivi | U5, U6 | Chaque écart de clôture au-delà de 500 FCFA est rattaché à une session et un opérateur ; le propriétaire voit les ventes sur son téléphone | Hors boutique |
| J3 — V1 complète | U7, U8, U10 | Réception de marchandise, vente à crédit et facture A4 fonctionnent de bout en bout | Hors boutique |
| Installation | V1 complète | Installation en boutique en une fois ; saisie du registre réel dans les semaines qui suivent | Boutique |

## Contraintes qui bornent le périmètre

Les contraintes détaillées sont dans `constraint-register.md`. Celles qui délimitent directement la V1 :

- **Hors ligne d'abord** : aucune fonctionnalité métier ne dépend du réseau (CT-01).
- **Le PC d'abord** (CT-02), sans lecteur de codes-barres (CT-04), avec une imprimante USB (CT-05).
- **Pas de TVA**, régime de l'impôt général synthétique (CR-01).
- **Données des clients limitées** au nom et au téléphone (CR-02).
- **Pas d'échéance ferme** ; planification par jalons démontrables (CO-02).

## Points ouverts

- La plateforme de l'application du propriétaire n'est pas décidée ; elle doit l'être avant U6 (faisabilité, dépendance D-04).
- Les exigences de l'approvisionnement, du crédit et de la facture A4 sont à écrire à l'analyse des exigences (faisabilité, dépendance D-01).
- Le service de reconnaissance de texte pour la saisie initiale du catalogue reste à choisir (faisabilité, dépendance D-02).

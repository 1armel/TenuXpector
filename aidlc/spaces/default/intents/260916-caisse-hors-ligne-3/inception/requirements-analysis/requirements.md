# Exigences — TenuXpector V1

Entrées : `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/scope-definition/scope-document.md`, `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/inception/practices-discovery/team-practices.md`, et `docs/exigences-tenuxpector.md`.

Les identifiants `FR{n}` et `NFR{n}` sont des clés de traçabilité permanentes : les étapes suivantes les conservent telles quelles. La colonne « Source » renvoie soit aux exigences déjà écrites par le propriétaire (`EF-`, `RG-`, `AL-`, `ENF-`, `DEC-`), soit aux réponses de cette étape (`Q1` à `Q8`).

## Analyse de l'intention

Le propriétaire d'un commerce de détail veut savoir à tout moment qui tenait la caisse, ce qui a été vendu, à quel prix et où sont les écarts — sans aucune connexion. Le but n'est pas d'informatiser pour informatiser : c'est de rendre chaque écart imputable à une personne, tout en remplaçant le papier pour tout ce que la boutique pratique déjà, y compris l'approvisionnement et le crédit. Un produit revendable à d'autres commerces est le second objectif ; quand les deux s'opposent, la boutique passe d'abord.

## Exigences fonctionnelles

### FR1 — Socle, identité et rôles

| ID | Exigence | Source |
|---|---|---|
| FR1.1 | Monorepo avec paquets de domaine, base, partagé et synchronisation, et applications caisse, propriétaire et API | EF-U0-01 |
| FR1.2 | Schéma versionné, chaque migration réversible ; toute table métier porte le tenant, la date de création, l'auteur et l'appareil | EF-U0-02 |
| FR1.3 | La base refuse toute modification ou suppression sur les journaux à ajout seul ; une vente n'est modifiable que par ses champs d'annulation, une seule fois | EF-U0-03 |
| FR1.4 | Isolation par tenant vérifiée sur toutes les routes | EF-U0-04 |
| FR1.5 | Identifiants UUID v7 générés sur l'appareil | EF-U0-05 |
| FR1.6 | Authentification par PIN de 4 à 6 chiffres, hachée, vérifiée sans réseau ; blocage après 5 échecs en 10 minutes | EF-U0-06 |
| FR1.7 | Jeu de données de démonstration : tenant fictif, 3 utilisateurs, 200 articles, 30 jours de ventes | EF-U0-07 |
| FR1.8 | Lecture typée et validée des paramètres, avec valeur par défaut documentée et surcharge par magasin | EF-U0-08 |
| FR1.9 | Le rôle de gérant est assignable et révocable par le propriétaire, sans réseau, et tracé | EF-U0-09, DEC-13 |

### FR2 — Calculs du domaine

| ID | Exigence | Source |
|---|---|---|
| FR2.1 | Quantité en stock = somme des mouvements signés ; état reconstituable à une date passée | EF-U1-01, EF-U1-02, RG-10 |
| FR2.2 | Coût unitaire moyen pondéré recalculé à chaque entrée, y compris quand le stock est nul ou négatif | EF-U1-03, RG-11 |
| FR2.3 | Conversion entre unité de vente et unité de base, sans flottant | EF-U1-04 |
| FR2.4 | Tarification d'une ligne : remise, indicateur sous plancher, écart au plancher | EF-U1-05, RG-02, RG-03 |
| FR2.5 | Totaux d'un ticket, marge, arrondis ; la dernière ligne absorbe le reste de ventilation | EF-U1-06, RG-04, RG-05 |
| FR2.6 | Paiements multiples et rendu de monnaie, le rendu ne pouvant venir que des espèces | EF-U1-07, RG-06 |
| FR2.7 | Espèces théoriques et écart d'une session | EF-U1-08, RG-20, RG-21 |
| FR2.8 | Moteur d'alertes pur, par événement et sur fenêtre glissante | EF-U1-09 |
| FR2.9 | Rapport de clôture journalier calculé dans le domaine | EF-U1-10 |
| FR2.10 | Tests de propriétés : indépendance à l'ordre, mouvement inverse, coût moyen toujours positif | EF-U1-11 |

### FR3 — Catalogue et première saisie

| ID | Exigence | Source |
|---|---|---|
| FR3.1 | Fiche article avec code interne unique par tenant, prix plancher inférieur ou égal au prix de référence, au moins une unité de vente | EF-U2-01 |
| FR3.2 | Recherche par fragment de désignation, synonyme, code interne ou code-barres, insensible à la casse et aux accents | EF-U2-02 |
| FR3.3 | Import de fichier avec prévisualisation puis validation ; une ligne en erreur n'empêche pas les autres ; réimport sans doublon | EF-U2-03 |
| FR3.4 | **L'import initial crée les articles et leurs prix, et ne crée aucun mouvement de stock.** Les quantités sont saisies séparément, à l'installation en boutique | Q8, corrige EF-U2-03 |
| FR3.5 | **Saisie du catalogue par photo du registre papier** : la photo est analysée pour en extraire désignations et prix de vente, présentés dans un écran de vérification modifiable avant import. Rien n'est importé sans validation humaine | Q4, Q8 |
| FR3.6 | Le moyen de reconnaissance de texte — sur l'appareil ou service tiers — est choisi à la preuve de concept. **Si un service tiers est retenu, les prix d'achat ne lui sont jamais transmis** | Q8, §2.2, R-02 |
| FR3.7 | La saisie clavier rapide reste un chemin complet et garanti : création minimale à quatre champs, saisie en série, duplication, complétude différée, synonymes | EF-U2-06 à EF-U2-12 |
| FR3.8 | Article jamais supprimé, seulement désactivé ; génération d'un code interne et d'une étiquette pour un article sans code-barres | EF-U2-04, EF-U2-05 |

### FR4 — Caisse hors ligne

| ID | Exigence | Source |
|---|---|---|
| FR4.1 | Sans session ouverte, la caisse n'offre que l'ouverture ; une seule session ouverte par caisse | EF-U3-01, EF-U3-03 |
| FR4.2 | Ouverture par PIN puis comptage à l'aveugle du fond, comparé au fond laissé ; nom de l'opérateur visible en permanence | EF-U3-02, EF-U3-04 |
| FR4.3 | Ajout d'article par recherche texte ou code interne ; unité de vente au choix ; quantité décimale seulement pour mètre, kilogramme et litre | EF-U3-10, DEC-11 |
| FR4.4 | Modification du prix d'une ligne ; sous le plancher, motif obligatoire | EF-U3-11 |
| FR4.5 | Jusqu'à cinq paniers en attente, persistés ; aucun panier en attente à la clôture | EF-U3-12 |
| FR4.6 | Encaissement en espèces, Camtel, MTN, Orange ou virement ; paiements multiples ; référence obligatoire pour le paiement mobile | EF-U3-13 |
| FR4.7 | Suppression de ligne et abandon de panier tracés avec leur contenu | EF-U3-14 |
| FR4.8 | Validation atomique : vente, lignes, paiements, mouvements de stock, mouvement de caisse, audit et événements de synchronisation dans une seule transaction | EF-U3-15 |
| FR4.9 | Annulation après encaissement : rôle supérieur ou dérogation, motif, mouvements inverses, remboursement rattaché à la session en cours | EF-U3-20, DEC-08 |
| FR4.10 | Entrée et sortie d'espèces avec motif et bénéficiaire | EF-U3-30 |
| FR4.11 | Clôture dans l'ordre imposé : paniers, comptage à l'aveugle, fond laissé et versement, puis seulement théorique et écart ; commentaire obligatoire au-delà du seuil | EF-U3-31 |
| FR4.12 | La clôture ne consulte ni n'attend aucun réseau ; fermeture forcée possible par un rôle supérieur | EF-U3-32, EF-U3-33 |
| FR4.13 | Ajustement manuel de stock par rôle supérieur, avec motif | EF-U3-40 |
| FR4.14 | Consultation du stock d'un article ; le vendeur voit la quantité et l'emplacement, jamais la valeur | EF-U3-41 |
| FR4.15 | Commande de recalcul du stock à partir des mouvements | EF-U3-42 |
| FR4.16 | Ajout au ticket au clavier seul, sans quitter le champ de recherche | EF-U3-17 |

### FR5 — Impression

| ID | Exigence | Source |
|---|---|---|
| FR5.1 | Ticket de vente 80 mm avec mentions de l'entreprise, numéro, date, nom de l'opérateur, lignes, remise, total, paiements et rendu | EF-U4-01 |
| FR5.2 | Ticket de clôture avec opérateur, heures, fond initial, ventes par mode, mouvements d'espèces, théorique, compté, écart, versement et alertes | EF-U4-02 |
| FR5.3 | Réimpression possible, marquée « DUPLICATA » et tracée | EF-U4-03 |
| FR5.4 | Une vente n'est jamais bloquée par l'imprimante ; les impressions échouées sont mises en file | EF-U4-04 |
| FR5.5 | Aperçu à l'écran pour les tests et la démonstration | EF-U4-05 |
| FR5.6 | L'imprimante est atteinte par un adaptateur remplaçable ; aucune marque dans le code | EF-U4-06 |
| FR5.7 | Tiroir-caisse implémenté et testé, inactif tant qu'aucun tiroir n'est déclaré | EF-U4-07, DEC-12 |

### FR6 — Audit, alertes et rapport

| ID | Exigence | Source |
|---|---|---|
| FR6.1 | Toute mutation et toute action sensible écrit une entrée d'audit avec les valeurs avant et après | EF-U5-01 |
| FR6.2 | Les règles d'alerte s'exécutent sur la caisse et ne s'affichent qu'aux rôles supérieurs | EF-U5-02, AL-01 à AL-22 |
| FR6.3 | Une alerte peut être marquée lue puis traitée avec commentaire ; jamais supprimée | EF-U5-03 |
| FR6.4 | Les règles glissantes s'évaluent à chaque clôture et au démarrage | EF-U5-04 |
| FR6.5 | Rapport journalier généré à la dernière clôture ou à l'heure limite | EF-U5-05 |
| FR6.6 | Écarts par opérateur sur 30 jours, ramenés à 100 tickets | EF-U5-06, RG-30 |

### FR7 — Synchronisation et suivi du propriétaire

| ID | Exigence | Source |
|---|---|---|
| FR7.1 | Chaque mutation écrit ses événements de synchronisation dans la même transaction | EF-U6-01 |
| FR7.2 | Interface de transport interchangeable, avec un curseur par transport | EF-U6-02 |
| FR7.3 | Envoi par lots ordonnés, avec nouvel essai à délai croissant | EF-U6-03 |
| FR7.4 | Le serveur est idempotent, accepte toute vente déjà encaissée et détecte les trous de numérotation | EF-U6-04, EF-U6-05, EF-U6-06 |
| FR7.5 | Transports serveur, proximité et fichier chiffré | EF-U6-10 à EF-U6-12 |
| FR7.6 | Application du propriétaire, accès vérifié côté API, appareil de confiance, verrouillage biométrique | EF-U6-20 à EF-U6-22 |
| FR7.7 | Écrans du propriétaire, fraîcheur des données visible, consultations journalisées | EF-U6-23 à EF-U6-25 |

### FR8 — Approvisionnement

| ID | Exigence | Source |
|---|---|---|
| FR8.1 | **Réception directe** : l'opérateur saisit une réception — fournisseur, date, articles, quantités, coût unitaire réel — sans commande préalable | Q1 |
| FR8.2 | La réception crée des mouvements d'entrée de stock au coût saisi, qui alimentent le coût moyen pondéré selon RG-11 | Q1, RG-11 |
| FR8.3 | Fiche fournisseur minimale : nom et téléphone. **Aucun suivi de dette fournisseur en V1** | Q1 |
| FR8.4 | Une réception est un document à ajout seul : correction par réception inverse, jamais par modification | Q1, invariants |
| FR8.5 | Réception réservée aux rôles gérant et propriétaire | §2.2 |
| FR8.6 | Le coût unitaire saisi n'est jamais visible d'un vendeur | §2.2, DEC-01 |

### FR9 — Crédit client

| ID | Exigence | Source |
|---|---|---|
| FR9.1 | Fiche client limitée au nom et au téléphone | Q2, CR-02 |
| FR9.2 | Chaque client porte un plafond de crédit, paramétrable | Q2 |
| FR9.3 | Le crédit devient un mode de paiement à la caisse, rattaché à un client | Q2 |
| FR9.4 | Si la vente porte le solde du client au-delà de son plafond, elle est refusée, **sauf dérogation par PIN du propriétaire**, tracée dans l'audit avec l'opérateur et l'auteur de la dérogation | Q2, §2.2 |
| FR9.5 | Remboursements partiels acceptés, dans tout mode de paiement encaissable | Q2 |
| FR9.6 | Le compte client est un journal à ajout seul ; le solde est calculé, jamais stocké de façon mutable | Q2, invariants |
| FR9.7 | Consultation du solde et de l'historique d'un client ; relevé imprimable | Q2 |

### FR10 — Facturation

| ID | Exigence | Source |
|---|---|---|
| FR10.1 | Une facture porte un numéro issu d'une **séquence propre aux factures**, distincte de celle des tickets, continue et sans trou. La continuité sans trou est une règle **présumée** (hypothèse H6), pas un fait légal vérifié | Q3, Q7 |
| FR10.2 | La facture sort **au choix de l'opérateur** : ticket thermique 80 mm ou export PDF A4 ; les deux sont disponibles dès la V1 | Q7 |
| FR10.3 | Mentions obligatoires : raison sociale et forme juridique, NIU, RCCM, adresse complète et coordonnées de l'entreprise ; NIU du client pour une vente à une entreprise. Liste **présumée** (hypothèse H2) | Q7, guides spécialisés |
| FR10.4 | Mention « TVA non applicable », le régime étant celui de l'impôt général synthétique | Q3, Q7, DEC-10 |
| FR10.5 | La facture est produite hors ligne, sans dépendre du réseau | Invariants |
| FR10.6 | Toute facture émise est tracée dans l'audit ; une réimpression est marquée « DUPLICATA » | EF-U4-03 |

## Exigences non fonctionnelles

| ID | Exigence | Source |
|---|---|---|
| NFR1 | Vente de 3 articles en moins de 20 s ; action d'interface sous 100 ms ; validation sous 300 ms | ENF-01 |
| NFR2 | Recherche d'article sous 200 ms au 95e centile sur 10 000 articles | ENF-02 |
| NFR3 | Démarrage à froid sous 5 s | ENF-03 |
| NFR4 | Aucune perte d'une vente validée en cas de coupure | ENF-04 |
| NFR5 | 60 jours ou 30 000 ventes sans synchronisation, sans dégradation de plus de 20 % | ENF-05 |
| NFR6 | Cibles tactiles d'au moins 48 dp, texte d'au moins 16 sp, contraste d'au moins 7:1 | ENF-06 |
| NFR7 | Interface en français, montants en FCFA, dates JJ/MM/AAAA, horodatages en UTC affichés à l'heure de Douala | ENF-07 |
| NFR8 | Base locale chiffrée, TLS 1.2 ou plus, jetons révocables, aucun secret dans le dépôt, aucun PIN ni prix d'achat ni jeton dans les journaux | ENF-08 |
| NFR9 | Moins de 1 Ko compressé par vente synchronisée | ENF-09 |
| NFR10 | Export chiffré quotidien et restauration testée | ENF-10 |
| NFR11 | TypeScript strict sans `any` ; couverture du domaine d'au moins 90 % des lignes et des branches ; parcours de bout en bout complet | ENF-11 |
| NFR12 | Journaux serveur structurés | ENF-12 |
| NFR13 | Installation chez un nouveau client en moins d'une heure | ENF-13 |
| NFR14 | Le mot désigné par ENF-14 n'apparaît dans aucun fichier de code | ENF-14 |
| NFR15 | Parité des deux cibles : le parcours complet passe à l'identique sur PC et sur tablette | ENF-15, Q5 |
| NFR16 | 50 articles créés en moins de 15 min ; ajout au ticket en moins de 5 s au clavier | ENF-16 |
| NFR17 | Résistance à la coupure d'alimentation sur les deux cibles ; onduleur exigé sur poste fixe | ENF-17 |
| NFR18 | **Vérifications bloquantes à chaque envoi de code** : recherche de secrets (ENF-08), contrôle du mot interdit (ENF-14), typecheck, lint, couverture et parcours de bout en bout sur la cible courante (ENF-11), audit des dépendances. Un échec empêche l'envoi | Q4 des pratiques, reformule ENF-08, 11, 14 |
| NFR19 | **Vérifications bloquantes avant chaque jalon** — cadence distincte de NFR18, jamais à chaque envoi : restauration d'une sauvegarde chiffrée comparée à l'original (ENF-10), parcours complet exécuté à l'identique sur les deux cibles (ENF-15), arrêts forcés et mesures de performance. Un échec empêche de déclarer le jalon atteint | Q4 des pratiques, reformule ENF-10, ENF-15 |
| NFR20 | Les vérifications de NFR18 et NFR19 passent en intégration continue avant l'installation en boutique, chacune gardant sa cadence | Q4 des pratiques |

## Contraintes

Les contraintes détaillées sont dans `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/feasibility/constraint-register.md`. Les plus structurantes : aucune fonctionnalité métier ne dépend du réseau ; le PC est construit en premier, la tablette livrée avec lui ; journaux à ajout seul ; arithmétique entière ; prix d'achat, coût moyen et marge invisibles d'un vendeur ; régime de l'impôt général synthétique, donc pas de TVA.

## Hypothèses

| ID | Hypothèse | À vérifier par |
|---|---|---|
| H1 | L'entreprise relève bien de l'impôt général synthétique | Le propriétaire, avant la mise en service |
| H2 | Les mentions de facture retenues sont conformes : les sources consultées sont des guides spécialisés, pas le texte officiel du Code général des impôts | Un comptable ou la DGI, avant la mise en service |
| H3 | Un moyen de reconnaissance de texte sait lire le registre du propriétaire avec une précision utilisable | Preuve de concept |
| H4 | Le PC de développement est représentatif du poste de caisse | Preuve de concept |
| H5 | La loi camerounaise sur les données personnelles n'impose rien d'incompatible avec la conservation du nom et du téléphone d'un client | Le propriétaire, avant la mise en service du crédit |
| H6 | La numérotation des factures doit être continue, chronologique et sans trou. Règle rapportée par des guides spécialisés comme relevant d'OHADA, **non vérifiée dans le texte officiel** | Un comptable ou la DGI, avant la mise en service |

## Hors périmètre

Commandes fournisseurs et dettes fournisseurs ; inventaires tournants ; console multi-client et accueil de nouveaux clients ; intégration par API des opérateurs de mobile money ; facturation électronique DGI ; plusieurs caisses dans un même magasin ; inscription en ligne et facturation par abonnement.

## Questions ouvertes

| ID | Question | Bloque |
|---|---|---|
| OQ1 | Quel moyen de reconnaissance de texte pour le registre, et sur l'appareil ou par un service tiers ? | FR3.5, FR3.6 |
| OQ2 | Quelle plateforme pour l'application du propriétaire ? | FR7.6 |
| OQ3 | Quel hébergeur pour le serveur de synchronisation ? | FR7.4 |
| OQ4 | Quels outils précis pour la recherche de secrets, les contrôles git et la couverture ? | NFR18 |
| OQ5 | Une facture peut-elle porter plusieurs paiements, dont un à crédit ? | FR9.3, FR10.1 |

# Tenu — Exigences précises (V1)

Version 1.0 · Document d'entrée pour la phase **Inception** d'AI-DLC.
Source : `docs/specifications.md` (cahier de cadrage). En cas de contradiction, **ce document fait foi** ; les écarts avec le cadrage sont listés en §4.

Conventions d'identifiants :
`DEC-xx` décision tranchée · `EF-Ux-xx` exigence fonctionnelle (unité x) · `RG-xx` règle de calcul · `AL-xx` règle d'alerte · `ENF-xx` exigence non fonctionnelle · `Q-xx` question ouverte.

Mots-clés : **DOIT** = obligatoire, **NE DOIT PAS** = interdit, **DEVRAIT** = recommandé sauf raison documentée dans un ADR.

---

## 1. Intention et périmètre

### 1.1 Intention

Construire un logiciel de caisse et de gestion de stock **hors ligne d'abord**, qui permet au propriétaire d'un commerce de détail de savoir à tout moment **qui tenait la caisse, ce qui a été vendu, à quel prix, et où sont les écarts**, même sans aucune connexion internet. Premier client : une quincaillerie familiale à Douala. Objectif secondaire : revendre le produit à d'autres commerces sans réécrire le cœur.

### 1.2 Périmètre de la V1 (unités 0 à 6)

| Unité | Contenu | Critère de fin |
|---|---|---|
| U0 | Socle : monorepo, schéma, migrations, seed, PIN, rôles | `pnpm test` et `pnpm migrate` passent sur une machine vierge |
| U1 | Domaine : stock, CUMP, tarification, TVA, marges | Couverture ≥ 90 % sur `packages/domain` |
| U2 | Catalogue et import Excel/CSV | Le catalogue réel de la boutique est importé sans erreur bloquante |
| U3 | Caisse hors ligne : ticket, encaissement, sessions, clôture | Une journée complète de ventes réelles est tenue sans réseau |
| U4 | Impression ticket thermique 80 mm | Un ticket conforme sort sur l'imprimante choisie |
| U5 | Audit, alertes, rapport de clôture | Chaque règle AL-xx a un test qui la déclenche |
| U6 | Synchro (outbox + transports) et tableau de bord propriétaire | Le propriétaire voit une vente sur son téléphone en < 60 s (niveau 2) |

### 1.3 Hors périmètre V1

Achats et fournisseurs (U7), clients et crédit (U8), inventaires tournants (U9), facture A4 (U10), console multi-client et onboarding (U11), intégration API des opérateurs mobile money, inscription en ligne, facturation SaaS, plusieurs caisses dans un même magasin.

> Conséquence : en V1, les entrées de stock se font par **import** (U2) et par **ajustement manuel** (EF-U3-40). Le paiement `credit` n'est **pas** proposé à la caisse en V1.

---

## 2. Acteurs, rôles et permissions

### 2.1 Acteurs

| Acteur | Description | Appareil |
|---|---|---|
| Propriétaire | Le père. Voit tout, valide les dérogations. | Téléphone personnel (appareil de confiance) + caisse |
| Gérant | Personne de confiance qui peut remplacer le propriétaire en boutique. | Caisse |
| Vendeur | Employé ou membre de la famille qui tient la caisse. | Caisse |
| Système | Règles automatiques (alertes, rapport, synchro). | Caisse et serveur |

### 2.2 Matrice des permissions

Légende : ✅ autorisé · 🔑 autorisé avec PIN d'un rôle supérieur (dérogation tracée) · ❌ interdit

| Action | Vendeur | Gérant | Propriétaire |
|---|---|---|---|
| Ouvrir / fermer sa session | ✅ | ✅ | ✅ |
| Vendre, mettre un ticket en attente | ✅ | ✅ | ✅ |
| Vendre sous le prix plancher (motif obligatoire) | ✅ | ✅ | ✅ |
| Supprimer une ligne ou abandonner un ticket avant encaissement | ✅ | ✅ | ✅ |
| Annuler une vente **après** encaissement | 🔑 | ✅ | ✅ |
| Entrée / sortie d'espèces (motif + bénéficiaire) | ✅ | ✅ | ✅ |
| Forcer la fermeture de la session d'un autre | ❌ | ✅ | ✅ |
| Ajustement manuel de stock | ❌ | ✅ | ✅ |
| Créer / modifier un article, un prix, un plancher | ❌ | ✅ | ✅ |
| Import du catalogue | ❌ | ✅ | ✅ |
| Voir prix d'achat, CUMP, marge, valorisation du stock | ❌ | ✅ | ✅ |
| Voir le CA cumulé et les écarts des autres sessions | ❌ | ✅ | ✅ |
| Gérer les utilisateurs et les paramètres | ❌ | ❌ | ✅ |
| Accéder au tableau de bord mobile | ❌ | ❌ | ✅ |
| Révoquer un appareil de confiance | ❌ | ❌ | ✅ |

Toute action 🔑 **DOIT** enregistrer dans `journal_audit` l'opérateur de la session **et** l'utilisateur qui a saisi son PIN.

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| Session (de caisse) | Période pendant laquelle **une seule** personne est responsable de la caisse, bornée par deux comptages d'espèces. |
| Fond initial | Espèces comptées à l'ouverture de la session. |
| Fond laissé | Espèces laissées dans le tiroir à la clôture pour la session suivante. |
| Versement | Espèces retirées à la clôture et remises au propriétaire. |
| Espèces théoriques | Montant que le tiroir devrait contenir d'après les opérations (RG-20). |
| Écart | Espèces comptées − espèces théoriques. Négatif = manquant. |
| Comptage à l'aveugle | L'opérateur saisit son comptage **avant** de voir le théorique. |
| Prix de référence | Prix de vente affiché par défaut pour une unité de vente. |
| Prix plancher | Prix sous lequel une vente est permise mais tracée et motivée. |
| CUMP | Coût unitaire moyen pondéré. |
| Unité de base | Unité de stockage d'un article (pièce, mètre, kilogramme, litre). |
| Unité de vente | Conditionnement vendu (carton, botte, sac, barre) avec un facteur de conversion vers l'unité de base. |
| Outbox | Table locale des événements à transmettre, écrite dans la même transaction que la donnée métier. |
| Transport | Canal qui vide l'outbox : aucun, proximité, serveur, fichier. |
| Appareil de confiance | Téléphone enregistré du propriétaire, seul autorisé à ouvrir le tableau de bord. |

---

## 4. Décisions tranchées et corrections du cadrage

Ces points étaient ambigus ou contradictoires dans le cadrage. Chaque décision **DOIT** faire l'objet d'un ADR dans `docs/adr/` pendant l'unité U0.

**DEC-01 — Données sensibles présentes sur la caisse.**
*Tension :* le cadrage (§4.3) dit que le prix d'achat et la marge « ne partent même pas vers l'appareil », mais le niveau 0 (sans réseau) exige que la caisse calcule elle-même le CUMP, les marges, les alertes et le rapport.
*Décision :* ces données **sont** stockées sur la caisse. La protection repose sur : (1) le filtrage par rôle dans la couche de lecture de l'UI de caisse, testé ; (2) le chiffrement de la base locale au repos ; (3) le filtrage par rôle **côté API** pour tout appareil autre que la caisse. L'objectif « un vendeur ne peut pas voir la marge en utilisant l'application » est tenu ; « un vendeur ne peut pas extraire la base de la tablette » relève du chiffrement et du verrouillage Android.

**DEC-02 — Plateforme de l'application de caisse.**
*Tension :* le cadrage prévoit une PWA, mais une PWA ne peut ni héberger un serveur local ni se faire découvrir en Bluetooth par le téléphone (transport de proximité, niveau 1), et l'accès aux imprimantes et au chiffrement SQLite y est limité.
*Décision proposée :* application **React + Vite empaquetée avec Capacitor pour Android**, avec SQLite natif chiffré (SQLCipher). Le code React reste le même ; seuls les adaptateurs (base, impression, transport de proximité) sont natifs. **À valider pendant l'Inception** (Q-01). Si la PWA est conservée, le niveau 1 est retiré de la V1.

**DEC-03 — Le stock peut devenir négatif.**
Une vente n'est **jamais** bloquée pour cause de stock insuffisant (le stock réel est souvent en avance sur la saisie). Un stock théorique négatif déclenche AL-09.

**DEC-04 — Représentation des nombres.**
- Montants : entiers en **FCFA** (XAF n'a pas de subdivision).
- Quantités : entiers en **millièmes de l'unité de base** (1 pièce = 1 000 ; 2,5 m = 2 500).
- CUMP : entier en **millièmes de FCFA par unité de base** (une vis à 3,5 FCFA = 3 500).
- Taux : entiers en **points de base** (19,25 % = 1 925).
- Aucun `number` flottant dans `domain` pour ces grandeurs ; les arrondis suivent RG-01.

**DEC-05 — Numérotation des tickets.**
Le numéro (`CAI1-2026-000123`) est attribué **au moment de la validation**, jamais à la création du panier. La séquence est **continue par caisse et par année**. Un panier abandonné n'a pas de numéro ; il est tracé par un événement d'audit (EF-U3-14).

**DEC-06 — Paniers en cours.**
Un panier non validé est stocké dans une table locale `paniers` (mutable, non synchronisée, jamais en mémoire seule). Il devient une `vente` immuable à la validation. Les suppressions de lignes avant encaissement sont tracées dans `journal_audit`.

**DEC-07 — Changement d'opérateur.**
Il n'existe **pas** de « changement d'utilisateur rapide ». Changer de personne = fermer la session (comptage) puis en ouvrir une nouvelle (comptage). Un verrouillage d'écran par inactivité ne change pas l'opérateur : seul l'opérateur de la session (ou un gérant/propriétaire) peut déverrouiller.

**DEC-08 — Annulation après encaissement dans une autre session.**
L'annulation est rattachée à la **session en cours** au moment de l'annulation. Le remboursement en espèces sort du tiroir de cette session. Les mouvements de stock inverses sont datés du jour de l'annulation.

**DEC-09 — Compléments au schéma du cadrage.**
Tables et colonnes manquantes, à ajouter en U0 :
- `caisses` : `id`, `tenant_id`, `magasin_id`, `code` (ex. `CAI1`), `libelle`, `prochain_numero`, `annee_numero`, `actif`.
- `sessions_caisse` : ajouter `fond_laisse`, `montant_verse`, `ecart_ouverture`, `fermee_par`, `mode_fermeture` (`normale` | `forcee`).
- `paniers` et `lignes_panier` (locales, cf. DEC-06).
- `outbox` : `id`, `tenant_id`, `type_evenement`, `entite_id`, `charge_json`, `cree_le`, `sequence_locale`.
- `curseurs_sync` : `transport`, `derniere_sequence_envoyee`, `dernier_curseur_recu`, `derniere_reussite`.
- `appareils_confiance` : comme au §4.3 du cadrage.
- `tentatives_pin` : `utilisateur_id`, `caisse_id`, `date`, `succes`.
- `lignes_vente` : ajouter `quantite_base` (quantité convertie en millièmes d'unité de base) et `motif_sous_plancher`.
- `ventes` : ajouter `caisse_id`, `session_annulation_id`, `type_annulation`.

**DEC-10 — Pas de TVA en dur, et TVA éventuellement non applicable.**
Le paramètre `tva.applicable` (booléen) et `tva.taux_pb` pilotent le calcul. Les prix saisis et affichés sont **TTC** par défaut (`prix.saisie_ttc = true`). Valeur proposée pour le taux : 1 925 pb, **à confirmer** (Q-02).

---

## 5. Exigences fonctionnelles

Format des critères d'acceptation : **Étant donné** / **Quand** / **Alors**. Chaque critère **DOIT** devenir au moins un test automatisé.

### U0 — Socle

**EF-U0-01 — Monorepo.** Structure `packages/{domain,db,shared,sync}` et `apps/{api,caisse,proprietaire}` (le tableau de bord est une application distincte, cf. §4.3 du cadrage). Gestionnaire : pnpm workspaces. Commandes racine : `dev`, `build`, `test`, `lint`, `typecheck`, `migrate`, `seed`, `recalculer-stock`.

**EF-U0-02 — Schéma et migrations.** Toutes les tables du cadrage §3 plus DEC-09. Chaque table métier porte `tenant_id`, `created_at`, `created_by`, `device_id`. Migrations versionnées **et réversibles** (chaque migration a son `down`).
- Étant donné une base vide, quand `migrate` puis `migrate:down` jusqu'à 0 puis `migrate` sont exécutés, alors le schéma final est identique au premier.

**EF-U0-03 — Immutabilité garantie par la base.** Sur PostgreSQL, des triggers **DOIVENT** rejeter tout `UPDATE` et `DELETE` sur `mouvements_stock`, `mouvements_caisse`, `mouvements_compte_client`, `journal_audit`, `ouvertures_tiroir`, `ventes` (sauf les colonnes d'annulation, une seule fois), `lignes_vente`, `paiements`. Même règle sur SQLite local.
- Étant donné une ligne dans `mouvements_stock`, quand un `UPDATE` est tenté, alors la base lève une erreur et la ligne est inchangée.

**EF-U0-04 — Isolation multi-tenant.** RLS activée sur toutes les tables métier côté serveur.
- Étant donné deux tenants A et B, quand un jeton de A interroge n'importe quelle route, alors aucune donnée de B n'est retournée (test paramétré sur toutes les routes).

**EF-U0-05 — Identifiants.** UUID v7 générés côté client pour toutes les entités créées sur un appareil.

**EF-U0-06 — Authentification par PIN (caisse).** PIN de 4 à 6 chiffres, stocké haché (PBKDF2-SHA256, ≥ 310 000 itérations, sel par utilisateur) dans la base locale. Vérification **sans réseau**.
- Quand 5 PIN erronés sont saisis pour un même utilisateur en 10 minutes, alors cet utilisateur est bloqué 5 minutes sur cette caisse et AL-12 est émise.

**EF-U0-07 — Seed.** Un jeu de données de démonstration (tenant fictif, 3 utilisateurs, 200 articles, 30 jours de ventes) sert au mode démonstration et aux tests E2E. Le mot « quincaillerie » n'apparaît que dans les données de seed, jamais dans le code.

**EF-U0-08 — Paramètres.** Lecture typée des paramètres via un schéma Zod ; valeur par défaut documentée (§9) ; surcharge possible par magasin.

### U1 — Domaine (`packages/domain`, fonctions pures)

**EF-U1-01 — Quantité en stock.** `quantiteStock(mouvements)` = somme des `quantite_base` signées (RG-10).

**EF-U1-02 — État à une date.** `etatStockAu(mouvements, date)` ne tient compte que des mouvements dont `date_operation ≤ date`.

**EF-U1-03 — CUMP.** Implémente RG-11, y compris le cas stock ≤ 0.

**EF-U1-04 — Conversion d'unités.** `versUniteBase(quantite, uniteVente)` et inverse, sans flottant.
- Étant donné une unité « carton » de facteur 12, quand on vend 2 cartons, alors `quantite_base` = −24 000.

**EF-U1-05 — Tarification d'une ligne.** Calcule remise, indicateur sous plancher, écart au plancher en pb (RG-02, RG-03).

**EF-U1-06 — Totaux d'un ticket.** TTC, HT, TVA, remise totale, marge (RG-04, RG-05).

**EF-U1-07 — Rendu de monnaie et paiements multiples.** La somme des paiements **DOIT** être ≥ au total TTC ; le rendu ne peut provenir que des espèces (RG-06).

**EF-U1-08 — Espèces théoriques et écart.** RG-20, RG-21.

**EF-U1-09 — Moteur d'alertes.** Fonction pure `evaluerAlertes(evenement, contexte, parametres) → Alerte[]` pour les règles par événement, et `evaluerAlertesPeriodiques(historique, parametres) → Alerte[]` pour les règles glissantes (§7).

**EF-U1-10 — Rapport de clôture.** `rapportJournalier(donneesDuJour) → Rapport` avec le contenu du cadrage §4 « Rapport quotidien ».

**EF-U1-11 — Tests de propriétés.** Pour toute suite aléatoire de mouvements : la quantité est indépendante de l'ordre d'insertion ; un mouvement suivi de son inverse ramène la quantité à la valeur initiale ; le CUMP reste ≥ 0.

### U2 — Catalogue et import

**EF-U2-01 — Fiche article.** Champs du cadrage §3 « Catalogue ». Contraintes : `code_interne` unique par tenant ; `prix_plancher ≤ prix_vente_reference` ; au moins une unité de vente (l'unité de base avec facteur 1 est créée automatiquement).

**EF-U2-02 — Recherche.** Par fragment de `designation`, de `designation_alt`, de `code_interne` ou `code_barres`, insensible à la casse **et aux accents** (« cle » trouve « Clé à molette »).
- Étant donné 10 000 articles, quand l'opérateur tape 3 caractères, alors les résultats s'affichent en moins de 200 ms sur la tablette cible (ENF-02).

**EF-U2-03 — Import Excel/CSV.** Modèle de fichier fourni (colonnes : code, désignation, synonymes, catégorie, unité de base, prix de vente, prix plancher, prix d'achat, quantité en stock, seuil d'alerte, emplacement, code-barres, unités de vente au format `carton:12:54000:50000;botte:5:...`).
- L'import se fait en deux temps : **prévisualisation** (lignes valides, avertissements, erreurs par ligne) puis **validation**.
- Une ligne en erreur n'empêche pas l'import des autres ; un rapport d'erreurs est téléchargeable.
- La quantité importée crée un mouvement `ENTREE_INVENTAIRE` au coût d'achat indiqué (qui initialise le CUMP).
- Réimporter le même fichier **NE DOIT PAS** dupliquer les articles (correspondance par `code_interne`) ni les stocks (un second import de stock génère un `AJUSTEMENT_INVENTAIRE` de la différence, avec confirmation).

**EF-U2-04 — Article sans code-barres.** Génération d'un `code_interne` court et d'une étiquette imprimable.

**EF-U2-05 — Désactivation.** Un article n'est jamais supprimé ; il est désactivé et disparaît de la recherche de caisse.

### U3 — Caisse hors ligne et sessions

*Ouverture*

**EF-U3-01 — Écran d'accueil.** Sans session ouverte, la caisse n'affiche que l'écran « Ouvrir la caisse ». Aucune vente n'est possible.

**EF-U3-02 — Ouverture.** L'opérateur choisit son nom, saisit son PIN, puis compte le fond **à l'aveugle**. Le système compare ensuite au `fond_laisse` de la session précédente et enregistre `ecart_ouverture`. Si l'écart d'ouverture ≠ 0, AL-02 est émise.

**EF-U3-03 — Une seule session ouverte par caisse.** Si une session est déjà ouverte par une autre personne, l'ouverture est refusée ; seul un gérant ou le propriétaire peut forcer sa fermeture (EF-U3-33).

**EF-U3-04 — Nom de l'opérateur visible en permanence** dans l'en-tête de l'écran de caisse.

*Vente*

**EF-U3-10 — Ajout d'article.** Par recherche, scan de code-barres ou code interne. Choix de l'unité de vente ; quantité décimale autorisée uniquement pour les unités de base mètre, kg, litre.

**EF-U3-11 — Modification du prix.** L'opérateur peut modifier le prix unitaire d'une ligne. Si le prix est sous le plancher, l'écran exige un motif (liste + texte libre) avant de continuer.

**EF-U3-12 — Mise en attente.** Jusqu'à 5 paniers en attente simultanés par session, persistés localement. Un panier en attente à la clôture **DOIT** être repris ou abandonné avant de fermer.

**EF-U3-13 — Encaissement.** Modes : `especes`, `orange_money`, `mtn_momo`, `virement`. Plusieurs paiements par vente. Pour le mobile money, la référence de transaction est **obligatoire** (saisie manuelle en V1).

**EF-U3-14 — Suppressions avant encaissement.** La suppression d'une ligne et l'abandon d'un panier sont autorisés, et **chacun** écrit un événement `journal_audit` (`LIGNE_SUPPRIMEE_AVANT_ENCAISSEMENT`, `PANIER_ABANDONNE`) avec le contenu supprimé.

**EF-U3-15 — Validation atomique.** Une seule transaction locale écrit : la vente, ses lignes, ses paiements, les mouvements de stock `SORTIE_VENTE` (valorisés au CUMP courant), le mouvement de caisse implicite, l'entrée d'audit et les événements `outbox`. L'écran « Vente validée » ne s'affiche **qu'après** le commit.
- Étant donné une coupure d'alimentation simulée à n'importe quel point de la transaction, quand l'application redémarre, alors soit la vente existe entièrement, soit elle n'existe pas du tout, et le panier est toujours présent.

**EF-U3-16 — Performance.** Voir ENF-01.

*Annulation*

**EF-U3-20 — Annulation après encaissement.** Nécessite un rôle gérant/propriétaire (ou PIN de dérogation), un motif obligatoire et un mode de remboursement. Génère les mouvements de stock inverses, un mouvement de caisse de sortie si remboursement en espèces, marque la vente `annulee` (seules colonnes modifiables, une seule fois), et émet AL-04.

*Espèces en cours de session*

**EF-U3-30 — Entrée / sortie d'espèces.** Bouton accessible depuis l'écran de caisse. Champs obligatoires : sens, montant, motif (liste paramétrable + « autre » avec texte), bénéficiaire pour une sortie. Écrit `mouvements_caisse`.

*Clôture*

**EF-U3-31 — Clôture, dans cet ordre exact d'écrans :**
1. Rappel des paniers en attente à traiter.
2. Saisie du **comptage des espèces** (aide au comptage par coupure : 10 000, 5 000, 2 000, 1 000, 500 billets ; 500, 100, 50, 25, 10 pièces).
3. Saisie du **fond laissé** et calcul du **versement** = compté − fond laissé.
4. Seulement ensuite : affichage du théorique et de l'écart.
5. Si |écart| > `caisse.seuil_ecart`, commentaire obligatoire.
6. Impression du ticket de clôture (U4) et du rapport (U5).
- Aucun écran **NE DOIT** afficher le théorique avant l'étape 4, y compris dans le rapport intermédiaire.
- Une fois l'étape 4 atteinte, le comptage **NE PEUT PLUS** être modifié.

**EF-U3-32 — Indépendance du réseau.** La clôture ne consulte ni n'attend aucun transport.

**EF-U3-33 — Fermeture forcée.** Un gérant ou le propriétaire peut fermer la session d'un autre (absent, départ précipité). Le comptage est fait par la personne qui force ; `mode_fermeture = forcee` ; AL-03 est émise.

*Stock*

**EF-U3-40 — Ajustement manuel.** Gérant/propriétaire, types `SORTIE_CASSE`, `SORTIE_PERTE`, `SORTIE_USAGE_INTERNE`, `ENTREE_INVENTAIRE`, `AJUSTEMENT_INVENTAIRE` ; motif obligatoire ; émet AL-08.

**EF-U3-41 — Consultation.** Fiche stock d'un article : quantité, historique des mouvements (filtrable). Le vendeur voit la quantité et l'emplacement, pas la valeur.

**EF-U3-42 — Recalcul.** La commande `recalculer-stock` reconstruit `stock_actuel` à partir des mouvements et signale toute différence avec le cache.

### U4 — Impression

**EF-U4-01 — Ticket de vente 80 mm (ESC/POS).** Contenu : raison sociale, NIU, RCCM, adresse, téléphone (depuis `parametres`) ; numéro de ticket ; date et heure ; **nom de l'opérateur** ; lignes (désignation, quantité, unité, prix, montant) ; remise totale si > 0 ; total TTC ; TVA si applicable ; paiements et rendu ; mention de pied paramétrable.

**EF-U4-02 — Ticket de clôture.** Opérateur, heures d'ouverture et de fermeture, fond initial, ventes par mode, entrées et sorties d'espèces (détaillées), théorique, compté, écart, fond laissé, versement, nombre de tickets, nombre d'annulations et de ventes sous plancher, alertes de la session.

**EF-U4-03 — Réimpression.** Possible, marquée « DUPLICATA », et tracée dans l'audit.

**EF-U4-04 — Imprimante absente.** Une vente n'est jamais bloquée par l'imprimante. Les impressions échouées sont mises en file et relançables.

**EF-U4-05 — Aperçu.** Un aperçu à l'écran du ticket existe pour les tests et la démonstration sans imprimante.

### U5 — Audit, alertes, rapport

**EF-U5-01 — Journal d'audit.** Toute mutation et toute action sensible (connexion, échec de PIN, dérogation, réimpression, consultation du tableau de bord) écrit une entrée avec `donnees_avant` / `donnees_apres`.

**EF-U5-02 — Alertes.** Les règles du §7 s'exécutent **sur la caisse**, écrivent dans `alertes`, et s'affichent sur la caisse **uniquement** aux rôles gérant/propriétaire.

**EF-U5-03 — Traitement d'une alerte.** Le propriétaire peut marquer une alerte lue puis traitée avec un commentaire. Une alerte n'est jamais supprimée.

**EF-U5-04 — Règles périodiques.** Les règles glissantes (AL-06, AL-07, AL-10, AL-11) s'évaluent à chaque clôture de session et au démarrage de l'application.

**EF-U5-05 — Rapport journalier.** Généré à la **dernière clôture de la journée** (ou à `rapport.heure_limite` si une session reste ouverte). Imprimé sur la caisse (niveau 0), envoyé par notification au propriétaire (niveau 2). Contenu : cadrage §4 « Rapport quotidien ».

**EF-U5-06 — Consultation des écarts par opérateur.** Écran (gérant/propriétaire) avec, par opérateur sur 30 jours : tickets, taux d'annulation après encaissement, taux de remise, taux de ventes sous plancher, écart moyen, **tous ramenés à 100 tickets** (RG-30).

### U6 — Synchronisation et tableau de bord propriétaire

*Moteur*

**EF-U6-01 — Outbox.** Chaque mutation écrit ses événements dans `outbox` dans la même transaction (vérifié par un test qui échoue si une mutation n'en produit pas).

**EF-U6-02 — Interface `SyncTransport`.** Telle que définie au cadrage §2.6. Un curseur par transport (`curseurs_sync`).

**EF-U6-03 — Envoi.** Par lots ordonnés par `sequence_locale` (max 200 événements ou 256 Ko par lot). Nouvel essai avec délai exponentiel (1 s → 5 min).

**EF-U6-04 — Idempotence serveur.** Un événement déjà reçu (même `id`) est acquitté sans être réappliqué.
- Étant donné un lot envoyé deux fois, alors l'état serveur est identique à un envoi unique.

**EF-U6-05 — Acceptation inconditionnelle.** Le serveur n'a pas le droit de refuser une vente déjà encaissée ; il l'enregistre et crée une alerte si une incohérence est détectée.

**EF-U6-06 — Détection de trous.** Le serveur vérifie la continuité des numéros de ticket par caisse et par année ; un trou déclenche AL-13.

**EF-U6-07 — Robustesse.** Test obligatoire : 500 ventes, transport coupé aléatoirement, redémarrages aléatoires ; à la fin, le serveur contient exactement 500 ventes, sans doublon.

*Transports*

**EF-U6-10 — `HttpServerTransport` (niveau 2).** HTTPS, jeton de caisse longue durée révocable, compression.

**EF-U6-11 — `LocalPeerTransport` (niveau 1).** Sous réserve de DEC-02. Appairage explicite une fois (code affiché sur la caisse), puis échange chiffré lorsque le téléphone du propriétaire est à proximité. Le téléphone conserve l'historique hors ligne.

**EF-U6-12 — `FileTransport`.** Export chiffré (mot de passe du propriétaire) vers un fichier, importable côté serveur ou téléphone. Sert aussi de sauvegarde quotidienne.

*Application propriétaire (`apps/proprietaire`)*

**EF-U6-20 — Accès.** Rôle `proprietaire` uniquement, vérifié **par l'API** sur chaque route (tests de refus pour `gerant` et `vendeur`).

**EF-U6-21 — Appareil de confiance.** Enregistrement à la première connexion ; jeton longue durée lié à l'appareil ; alerte AL-14 sur l'appareil existant lors de tout nouvel enregistrement ; révocation depuis un autre appareil ou côté serveur.

**EF-U6-22 — Verrouillage.** Biométrie ou PIN à chaque ouverture et après 2 minutes en arrière-plan.

**EF-U6-23 — Écrans.** Aujourd'hui (CA, marge, tickets, panier moyen, session en cours et opérateur, fraîcheur de la dernière synchro) ; Alertes ; Stock d'un article ; Sessions et écarts ; Comparaison des opérateurs (EF-U5-06) ; Rapport journalier.

**EF-U6-24 — Fraîcheur visible.** Chaque écran indique « Données à jour il y a X min ». Au-delà de `sync.alerte_silence_min` sans synchro pendant les horaires d'ouverture, AL-15 est affichée.

**EF-U6-25 — Journalisation des consultations** du tableau de bord (EF-U5-01).

---

## 6. Règles de calcul

Toutes ces règles vivent dans `packages/domain` et sont couvertes par des tests avec exemples chiffrés.

**RG-01 — Arrondi.** Division entière arrondie au plus proche, demi vers le haut. Une seule fonction `arrondir(numerateur, denominateur)` dans `domain`, utilisée partout. Arrondi des encaissements en espèces au multiple `caisse.arrondi_especes` (défaut 1, c'est-à-dire aucun arrondi ; cf. Q-07).

**RG-02 — Remise de ligne.** `remise_ligne = max(0, prix_reference − prix_applique) × quantite_vente`.

**RG-03 — Sous plancher.** Une ligne est sous plancher si `prix_applique < prix_plancher_applique`.
`ecart_plancher_pb = plancher_diff × 10 000 ÷ prix_plancher_applique` (arrondi inférieur), avec `plancher_diff = prix_plancher_applique − prix_applique`.

**RG-04 — Totaux.**
- `montant_ligne_ttc = arrondir(prix_applique × quantite_vente_milliemes, 1 000)`.
- `total_ttc = Σ montant_ligne_ttc`.
- Si `tva.applicable` et saisie TTC : `total_ht = arrondir(total_ttc × 10 000, 10 000 + tva.taux_pb)` et `montant_tva = total_ttc − total_ht`.
- Si TVA non applicable : `total_ht = total_ttc`, `montant_tva = 0`.
- Le HT par ligne est ventilé au prorata du TTC ; la **dernière ligne absorbe le reste** pour que `Σ ht_ligne = total_ht` exactement.

**RG-05 — Coût et marge.**
- `cout_ligne = arrondir(|quantite_base| × cump_au_moment, 1 000 000)` (quantité en millièmes × CUMP en millièmes de FCFA).
- `marge_ligne = ht_ligne − cout_ligne` (peut être négative, cf. AL-11).
- Exemple : 24 vis (quantite_base = 24 000) à un CUMP de 3,5 FCFA (3 500) → `cout_ligne` = 84 FCFA.

**RG-06 — Paiements.** `Σ paiements ≥ total_ttc`. `rendu = Σ paiements − total_ttc`. Le rendu **DOIT** être ≤ au montant payé en espèces ; sinon la validation est refusée. `especes_nettes = especes_recues − rendu`.

**RG-10 — Quantité en stock.** `Σ quantite_base` des mouvements de l'article pour le magasin.

**RG-11 — CUMP (à chaque entrée de quantité q > 0 au coût c).**
- Si `Q_avant ≤ 0` : `cump = c`.
- Sinon : `cump = arrondir(Q_avant × cump_avant + q × c, Q_avant + q)`.
- Les sorties ne modifient pas le CUMP et sont valorisées au CUMP courant.
- Un retour en stock suite à annulation entre au coût de la sortie d'origine.
- Un ajustement d'inventaire positif entre au CUMP courant (CUMP inchangé).

**RG-12 — Valeur du stock.** `arrondir(Q × cump, 1 000 000)`.

**RG-20 — Espèces théoriques d'une session.**
`fond_initial + Σ especes_nettes (ventes validées de la session) + Σ entrées d'espèces − Σ sorties d'espèces − Σ remboursements en espèces (annulations faites dans la session)`.

**RG-21 — Écart et versement.**
`ecart = especes_comptees − especes_theoriques` (négatif = manquant).
`montant_verse = especes_comptees − fond_laisse`, avec `0 ≤ fond_laisse ≤ especes_comptees`.

**RG-30 — Taux pour 100 tickets.**
`taux = nb_evenements × 100 ÷ nb_tickets_valides` sur la période, affiché à une décimale. Non calculé (mention « échantillon insuffisant ») si `nb_tickets_valides < alertes.echantillon_min`.

---

## 7. Règles d'alerte

Sévérités : **haute** = notification immédiate (niveau 2) et bandeau sur la caisse pour gérant/propriétaire · **moyenne** = tableau de bord et rapport · **basse** = rapport uniquement.

| Code | Déclencheur | Sévérité | Paramètres (défaut) |
|---|---|---|---|
| AL-01 | \|écart de clôture\| > seuil | haute si manquant, moyenne si excédent | `caisse.seuil_ecart` (2 000) |
| AL-02 | Écart d'ouverture ≠ 0 | moyenne | — |
| AL-03 | Fermeture forcée d'une session | moyenne | — |
| AL-04 | Annulation après encaissement | haute | — |
| AL-05 | Vente sous plancher au-delà du seuil | moyenne | `alertes.sous_plancher_pb` (1 000 = 10 %) |
| AL-06 | Manquants répétés sous le seuil : sur les N dernières sessions d'un opérateur, au moins K manquants chacun ≤ seuil, dont la somme ≥ cumul | haute | `alertes.fenetre_sessions` (10), `alertes.nb_manquants_min` (3), `alertes.cumul_manquants` (5 000) |
| AL-07 | Opérateur atypique : taux d'annulation, de remise ou de vente sous plancher > facteur × médiane des autres opérateurs sur 30 jours | moyenne | `alertes.facteur_atypique` (3), `alertes.echantillon_min` (50) ; non calculé s'il y a moins de 2 opérateurs |
| AL-08 | Ajustement manuel de stock | basse ; moyenne si valeur > seuil | `alertes.ajustement_valeur` (10 000) |
| AL-09 | Stock théorique négatif | basse | — |
| AL-10 | Sorties d'espèces d'une session > facteur × moyenne des 20 dernières sessions | moyenne | `alertes.facteur_sorties` (2), minimum 5 sessions d'historique |
| AL-11 | Marge moyenne d'un opérateur inférieure à la médiane de plus de X points sur 30 jours | moyenne | `alertes.ecart_marge_pb` (500) |
| AL-12 | Blocage après échecs de PIN | moyenne | 5 échecs / 10 min |
| AL-13 | Trou dans la numérotation des tickets (serveur) | haute | — |
| AL-14 | Nouvel appareil enregistré pour le propriétaire | haute | — |
| AL-15 | Aucune synchro depuis X min pendant les horaires d'ouverture | moyenne | `sync.alerte_silence_min` (30) |
| AL-16 | Rupture non expliquée : stock atteint ≤ 0 par un mouvement autre qu'une vente | moyenne | — |
| AL-17 | Vente hors horaires d'ouverture | moyenne | `magasin.horaires` |
| AL-18 | Stock sous le seuil d'alerte de l'article | basse | `articles.seuil_alerte_stock` |
| AL-19 | Horloge de la caisse décalée de plus de X min par rapport au serveur (fraude possible sur les horaires) | haute | `sync.derive_horloge_min` (10) |

Hors V1 : ouverture de tiroir sans vente (seulement si un tiroir électronique est branché, Q-04).

Chaque alerte **DOIT** contenir : opérateur, session, entité liée, valeurs ayant déclenché la règle, valeur du paramètre au moment du déclenchement.

---

## 8. Exigences non fonctionnelles

| Code | Exigence | Méthode de vérification |
|---|---|---|
| ENF-01 | Vente de 3 articles (recherche, ajout, encaissement espèces) en **< 20 s** par un opérateur formé ; chaque action d'interface < 100 ms ; validation < 300 ms | Médiane de 10 essais chronométrés sur la tablette cible ; mesures automatiques Playwright |
| ENF-02 | Recherche d'article < 200 ms (p95) sur 10 000 articles | Test de performance sur la tablette cible |
| ENF-03 | Démarrage à froid < 5 s | Mesure sur la tablette cible |
| ENF-04 | Zéro perte d'une vente validée en cas de coupure | 100 arrêts forcés aléatoires pendant une série de ventes |
| ENF-05 | 60 jours ou 30 000 ventes sans synchro, sans dégradation de plus de 20 % des temps ENF-01/02 | Test de charge sur base de seed volumineuse |
| ENF-06 | Cibles tactiles ≥ 48 dp ; texte ≥ 16 sp ; montants ≥ 24 sp ; contraste ≥ 7:1 sur l'écran de caisse ; tablette 10" portrait et paysage | Revue visuelle et contrôle automatique du contraste |
| ENF-07 | Interface en français ; montants au format « 12 500 FCFA » ; dates JJ/MM/AAAA ; horodatages stockés en UTC, affichés en `Africa/Douala` | Tests unitaires des formateurs |
| ENF-08 | Base locale chiffrée ; TLS 1.2+ ; jetons révocables ; aucun secret dans le dépôt ; aucun PIN, prix d'achat ou jeton dans les logs | Revue de code et analyse de secrets en CI |
| ENF-09 | < 1 Ko compressé par vente synchronisée en moyenne | Mesure sur le seed |
| ENF-10 | Export chiffré quotidien automatique ; restauration testée | Test CI : sauvegarde → restauration → comparaison |
| ENF-11 | TypeScript strict, aucun `any` ; couverture `domain` ≥ 90 % (lignes et branches) ; E2E ouverture → vente → annulation → sortie d'espèces → clôture | CI bloquante |
| ENF-12 | Logs serveur structurés (tenant, magasin, caisse, version, id de requête) | Revue |
| ENF-13 | Installation chez un nouveau client en < 1 h, import compris | Répétition chronométrée avec le seed |
| ENF-14 | Le mot « quincaillerie » n'apparaît dans aucun fichier de code | Contrôle automatique en CI (hors seed et docs) |

---

## 9. Paramètres et valeurs par défaut

Toutes ces valeurs sont des **propositions à valider** (Q-06). Stockées dans `parametres`, surchargeables par magasin.

| Clé | Défaut | Rôle |
|---|---|---|
| `devise` | `XAF` | Devise |
| `tva.applicable` | `true` | Active le calcul de TVA |
| `tva.taux_pb` | `1925` | Taux de TVA (à confirmer, Q-02) |
| `prix.saisie_ttc` | `true` | Les prix saisis sont TTC |
| `caisse.seuil_ecart` | `2000` | AL-01 |
| `caisse.arrondi_especes` | `1` | RG-01 |
| `caisse.max_paniers_attente` | `5` | EF-U3-12 |
| `caisse.verrouillage_inactivite_s` | `120` | DEC-07 |
| `caisse.motifs_sortie` | `["Fournisseur","Transport","Course","Avance salaire","Autre"]` | EF-U3-30 |
| `caisse.motifs_sous_plancher` | `["Client fidèle","Quantité importante","Alignement concurrence","Article abîmé","Autre"]` | EF-U3-11 |
| `magasin.horaires` | lun–sam 07:30–19:00 | AL-17 |
| `rapport.heure_limite` | `21:00` | EF-U5-05 |
| `alertes.*` | cf. §7 | Règles d'alerte |
| `sync.alerte_silence_min` | `30` | AL-15 |
| `sync.derive_horloge_min` | `10` | AL-19 |
| `ticket.pied` | « Merci de votre visite » | EF-U4-01 |
| `numerotation.format` | `{caisse}-{annee}-{seq:6}` | DEC-05 |

---

## 10. Questions ouvertes

À trancher avant ou pendant l'Inception. AI-DLC posera ses propres questions ; celles-ci sont déjà identifiées.

| Code | Question | Bloque |
|---|---|---|
| Q-01 | PWA pure ou application Android via Capacitor (DEC-02) ? | U0, U4, U6 |
| Q-02 | Régime fiscal de l'entreprise, TVA applicable ou non, taux, mentions obligatoires et règles de facturation DGI | U1, U4 |
| Q-03 | Modèle de tablette (version d'Android, mémoire) et d'imprimante (USB ou Bluetooth, marque) | U3, U4 |
| Q-04 | Un tiroir-caisse électronique sera-t-il branché ? | U5 |
| Q-05 | Horaires réels d'ouverture, jours fériés | U5 |
| Q-06 | Validation des seuils du §9 avec le propriétaire | U5 |
| Q-07 | Faut-il arrondir les encaissements en espèces (manque de petite monnaie) ? | U1, U3 |
| Q-08 | Nombre d'articles, existence d'un fichier de stock, proportion d'articles avec code-barres | U2 |
| Q-09 | Opérateur de la carte SIM de la tablette et forfait | U6 |
| Q-10 | Hébergement : VPS ou Supabase ? | U6 |
| Q-11 | Qui aura le rôle `gerant` ? | U0 |

---

## 11. Découpage en unités de travail pour AI-DLC

| Unité | Dépend de | Exigences couvertes | Démontrable au propriétaire |
|---|---|---|---|
| U0 Socle | — | EF-U0-*, DEC-01 à DEC-10 (ADR) | Non |
| U1 Domaine | U0 | EF-U1-*, RG-*, AL-* (logique) | Non (suite de tests) |
| U2 Catalogue | U0, U1 | EF-U2-* | Oui : ses articles dans le système |
| U3 Caisse | U1, U2 | EF-U3-*, ENF-01 à 07 | Oui : une vraie journée de ventes |
| U4 Impression | U3 | EF-U4-* | Oui : tickets papier |
| U5 Anti-vol | U3 | EF-U5-*, AL-* (branchement) | Oui : alertes et rapport imprimé |
| U6 Synchro | U3, U5 | EF-U6-*, ENF-08 à 10 | Oui : suivi sur son téléphone |

Règles de passage : ne pas commencer une unité tant que la précédente n'est pas **utilisée en boutique** (sauf U0 → U1 → U2, enchaînables). Chaque unité se termine par : tests verts, ADR à jour, démonstration.

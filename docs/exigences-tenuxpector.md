# TenuXpector — Exigences précises (V1)

Version 1.0 · Document d'entrée pour la phase **Inception** d'AI-DLC.
Source : `docs/specifications.md` (cahier de cadrage). En cas de contradiction, **ce document fait foi** ; les écarts avec le cadrage sont listés en §4.

Conventions d'identifiants :
`DEC-xx` décision tranchée · `EF-Ux-xx` exigence fonctionnelle (unité x) · `RG-xx` règle de calcul · `AL-xx` règle d'alerte · `ENF-xx` exigence non fonctionnelle · `Q-xx` question ouverte.

Mots-clés : **DOIT** = obligatoire, **NE DOIT PAS** = interdit, **DEVRAIT** = recommandé sauf raison documentée dans un ADR.

---

## 1. Intention et périmètre

### 1.1 Intention

Construire un logiciel de caisse et de gestion de stock **hors ligne d'abord**, qui permet au propriétaire d'un commerce de détail de savoir à tout moment **qui tenait la caisse, ce qui a été vendu, à quel prix, et où sont les écarts**, même sans aucune connexion internet. Premier client : une quincaillerie familiale à Douala. Objectif secondaire : revendre le produit à d'autres commerces sans réécrire le cœur.

### 1.2 Périmètre de la V1 (unités 0 à 8, plus U10)

| Unité | Contenu                                                                                                                                                                  | Critère de fin                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| U0     | Socle : monorepo, schéma, migrations, seed, PIN, rôles                                                                                                                 | `pnpm test` et `pnpm migrate` passent sur une machine vierge         |
| U1     | Domaine : stock, CUMP, tarification, TVA, marges                                                                                                                         | Couverture ≥ 90 % sur`packages/domain`                                |
| U2     | Catalogue : saisie clavier rapide, import de fichier, et **saisie par photo du registre papier** pour obtenir désignations et prix (moyen de reconnaissance choisi à la preuve de concept, cf. FR3.5 et FR3.6) | Le catalogue réel de la boutique est importé sans erreur bloquante     |
| U3     | Caisse hors ligne : ticket, encaissement, sessions, clôture                                                                                                             | Une journée complète de ventes réelles est tenue sans réseau         |
| U4     | Impression ticket thermique 80 mm                                                                                                                                        | Un ticket conforme sort sur l'imprimante choisie                         |
| U5     | Audit, alertes, rapport de clôture                                                                                                                                      | Chaque règle AL-xx a un test qui la déclenche                          |
| U6     | Synchro (outbox + transports) et tableau de bord propriétaire                                                                                                           | Le propriétaire voit une vente sur son téléphone en < 60 s (niveau 2) |
| U7     | **Approvisionnement** : réception directe de marchandise, fournisseurs, entrées de stock au coût réel                                                                    | Une réception réelle alimente le stock et le CUMP sans saisie manuelle de quantité |
| U8     | **Clients et crédit** : fiche client, plafond, vente à crédit, remboursements, relevé                                                                                    | Une vente à crédit et son remboursement partiel sont tenus de bout en bout |
| U10    | **Facturation** : numérotation propre, ticket thermique ou PDF A4 au choix                                                                                              | Une facture conforme sort dans les deux formats                        |

> Le PC (Electron) est construit en premier ; la **tablette Android (Capacitor) fait partie de la V1** et est livrée en même temps (DEC-02).
> Une **preuve de concept** précède le socle : base locale chiffrée, impression USB, survie à une coupure (§10, Q-01).

### 1.3 Hors périmètre V1

Commandes fournisseurs et suivi des dettes fournisseurs, inventaires tournants (U9), console multi-client et onboarding (U11), intégration API des opérateurs mobile money, inscription en ligne, facturation SaaS, plusieurs caisses dans un même magasin, facturation électronique DGI.

> Conséquence : en V1, les entrées de stock se font par **réception** (U7), par **ajustement manuel** (EF-U3-40) et par la saisie des quantités à l'installation. L'import initial du catalogue (U2) crée les articles et leurs prix, **jamais de quantité**. Le paiement `credit` **est** proposé à la caisse (U8).

### 1.4 Cibles d'exécution, matériel et hébergement

Ces choix étaient les questions ouvertes Q-01, Q-03, Q-09 et Q-10. Ils sont tranchés ; le détail et les conséquences sont en §4 (DEC-02, DEC-11) et §10.

**Cibles d'exécution.** La caisse tourne sur **deux** cibles, à partir du même code TypeScript :

| Cible                        | Empaquetage | Usage                                                             |
| ---------------------------- | ----------- | ----------------------------------------------------------------- |
| Tablette Android             | Capacitor   | Poste de caisse mobile, survit aux coupures grâce à sa batterie |
| Ordinateur (Windows / Linux) | Electron    | Poste de caisse fixe, comptoir alimenté sur secteur              |

Le cœur métier, l'interface React et la couche de lecture sont **identiques** sur les deux cibles. Seuls les adaptateurs diffèrent : base locale chiffrée, impression, transport de proximité, alimentation. Cette parité est une exigence vérifiée (ENF-15).

**Coupures de courant.** Les deux cibles doivent survivre à une coupure à n'importe quel instant, sans perte d'une vente validée (ENF-04) et sans redémarrage en pleine vente (ENF-17). La tablette s'appuie sur sa batterie ; le poste fixe exige un onduleur.

**Matériel.**

- **Pas de lecteur de codes-barres** chez le premier client. La saisie se fait par recherche texte et par code interne. Le code-barres reste géré dans le modèle de données pour la revente, mais aucun parcours de caisse n'en dépend (EF-U3-10).
- **Imprimante thermique 80 mm en USB.** Aucun modèle n'est présumé : l'application parle ESC/POS derrière un adaptateur remplaçable (DEC-11, EF-U4-06).
- **Pas de tiroir-caisse électronique** chez le premier client, mais le modèle et les alertes le prévoient pour la revente (DEC-12, EF-U4-07, AL-21).

**Paiement mobile.** Les trois opérateurs **Camtel**, **MTN** et **Orange** doivent être proposés à l'encaissement (EF-U6-10 et la liste `modes_paiement`). En V1 la référence de transaction est saisie à la main ; aucune intégration d'API opérateur.

**Hébergement.** PostgreSQL local via **Docker** en développement ; **VPS en Europe de l'Ouest** en production, pour la latence vers l'Afrique centrale. L'hébergeur précis reste à choisir avant U6 (§10).

---

## 2. Acteurs, rôles et permissions

### 2.1 Acteurs

| Acteur        | Description                                                            | Appareil                                               |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Propriétaire | Le père. Voit tout, valide les dérogations.                          | Téléphone personnel (appareil de confiance) + caisse |
| Gérant       | Personne de confiance qui peut remplacer le propriétaire en boutique. | Caisse                                                 |
| Vendeur       | Employé ou membre de la famille qui tient la caisse.                  | Caisse                                                 |
| Système      | Règles automatiques (alertes, rapport, synchro).                      | Caisse et serveur                                      |

### 2.2 Matrice des permissions

Légende : ✅ autorisé · 🔑 autorisé avec PIN d'un rôle supérieur (dérogation tracée) · ❌ interdit

| Action                                                         | Vendeur | Gérant | Propriétaire |
| -------------------------------------------------------------- | ------- | ------- | ------------- |
| Ouvrir / fermer sa session                                     | ✅      | ✅      | ✅            |
| Vendre, mettre un ticket en attente                            | ✅      | ✅      | ✅            |
| Vendre sous le prix plancher (motif obligatoire)               | ✅      | ✅      | ✅            |
| Supprimer une ligne ou abandonner un ticket avant encaissement | ✅      | ✅      | ✅            |
| Annuler une vente**après** encaissement                 | 🔑      | ✅      | ✅            |
| Entrée / sortie d'espèces (motif + bénéficiaire)           | ✅      | ✅      | ✅            |
| Forcer la fermeture de la session d'un autre                   | ❌      | ✅      | ✅            |
| Ajustement manuel de stock                                     | ❌      | ✅      | ✅            |
| Créer / modifier un article, un prix, un plancher             | ❌      | ✅      | ✅            |
| Import du catalogue                                            | ❌      | ✅      | ✅            |
| Saisie du catalogue par photo du registre                      | ❌      | ✅      | ✅            |
| Enregistrer une réception de marchandise (U7)                 | ❌      | ✅      | ✅            |
| Créer / modifier un fournisseur (U7)                          | ❌      | ✅      | ✅            |
| Voir le coût unitaire d'une réception (U7)                   | ❌      | ✅      | ✅            |
| Créer / modifier un client et son plafond de crédit (U8)      | ❌      | ✅      | ✅            |
| Vendre à crédit dans la limite du plafond (U8)                | ✅      | ✅      | ✅            |
| Vendre à crédit au-delà du plafond (U8)                      | 🔑 (propriétaire uniquement) | 🔑 (propriétaire uniquement) | ✅ |
| Encaisser un remboursement de crédit (U8)                      | ✅      | ✅      | ✅            |
| Consulter le solde et le relevé d'un client (U8)               | ✅      | ✅      | ✅            |
| Émettre une facture (U10)                                     | ✅      | ✅      | ✅            |
| Réimprimer une facture en duplicata (U10)                     | 🔑      | ✅      | ✅            |
| Voir prix d'achat, CUMP, marge, valorisation du stock          | ❌      | ✅      | ✅            |
| Voir le CA cumulé et les écarts des autres sessions          | ❌      | ✅      | ✅            |
| Gérer les utilisateurs et les paramètres                     | ❌      | ❌      | ✅            |
| Accéder au tableau de bord mobile                             | ❌      | ❌      | ✅            |
| Révoquer un appareil de confiance                             | ❌      | ❌      | ✅            |

Toute action 🔑 **DOIT** enregistrer dans `journal_audit` l'opérateur de la session **et** l'utilisateur qui a saisi son PIN.

---

## 3. Glossaire

| Terme                 | Définition                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Session (de caisse)   | Période pendant laquelle**une seule** personne est responsable de la caisse, bornée par deux comptages d'espèces. |
| Fond initial          | Espèces comptées à l'ouverture de la session.                                                                           |
| Fond laissé          | Espèces laissées dans le tiroir à la clôture pour la session suivante.                                                 |
| Versement             | Espèces retirées à la clôture et remises au propriétaire.                                                             |
| Espèces théoriques  | Montant que le tiroir devrait contenir d'après les opérations (RG-20).                                                   |
| Écart                | Espèces comptées − espèces théoriques. Négatif = manquant.                                                           |
| Comptage à l'aveugle | L'opérateur saisit son comptage**avant** de voir le théorique.                                                     |
| Prix de référence   | Prix de vente affiché par défaut pour une unité de vente.                                                               |
| Prix plancher         | Prix sous lequel une vente est permise mais tracée et motivée.                                                           |
| CUMP                  | Coût unitaire moyen pondéré.                                                                                            |
| Unité de base        | Unité de stockage d'un article (pièce, mètre, kilogramme, litre).                                                       |
| Unité de vente       | Conditionnement vendu (carton, botte, sac, barre) avec un facteur de conversion vers l'unité de base.                     |
| Outbox                | Table locale des événements à transmettre, écrite dans la même transaction que la donnée métier.                    |
| Transport             | Canal qui vide l'outbox : aucun, proximité, serveur, fichier.                                                             |
| Appareil de confiance | Téléphone enregistré du propriétaire, seul autorisé à ouvrir le tableau de bord.                                     |

---

## 4. Décisions tranchées et corrections du cadrage

Ces points étaient ambigus ou contradictoires dans le cadrage. Chaque décision **DOIT** faire l'objet d'un ADR dans `docs/adr/` pendant l'unité U0.

**DEC-01 — Données sensibles présentes sur la caisse.**
*Tension :* le cadrage (§4.3) dit que le prix d'achat et la marge « ne partent même pas vers l'appareil », mais le niveau 0 (sans réseau) exige que la caisse calcule elle-même le CUMP, les marges, les alertes et le rapport.
*Décision :* ces données **sont** stockées sur la caisse. La protection repose sur : (1) le filtrage par rôle dans la couche de lecture de l'UI de caisse, testé ; (2) le chiffrement de la base locale au repos ; (3) le filtrage par rôle **côté API** pour tout appareil autre que la caisse. L'objectif « un vendeur ne peut pas voir la marge en utilisant l'application » est tenu ; « un vendeur ne peut pas extraire la base de la tablette » relève du chiffrement et du verrouillage Android.

**DEC-02 — Plateforme de l'application de caisse. TRANCHÉE.**
*Tension :* le cadrage prévoit une PWA, mais une PWA ne peut ni héberger un serveur local ni se faire découvrir en Bluetooth par le téléphone (transport de proximité, niveau 1), et l'accès aux imprimantes et au chiffrement SQLite y est limité.
*Décision :* la PWA est **écartée**. L'application est écrite une fois en **React + Vite + TypeScript**, puis empaquetée pour **deux** cibles :

- **Capacitor** pour la tablette Android ;
- **Electron** pour l'ordinateur de comptoir (Windows / Linux).

Base locale SQLite chiffrée (SQLCipher) sur les deux cibles. Le code métier, l'interface et la couche de lecture sont partagés ; seuls les adaptateurs sont spécifiques à la cible : base, impression, transport de proximité, alimentation. La parité fonctionnelle entre les deux cibles est vérifiée (ENF-15).
*Conséquences :* le niveau 1 (transport de proximité) reste dans la V1, puisque les deux cibles peuvent écouter en réseau local. `apps/caisse` porte le code partagé ; l'empaquetage vit dans deux dossiers distincts et ne contient aucune règle métier. Une **preuve de concept sur les deux cibles** est exigée avant d'engager U0 (§10, Q-01).

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

**DEC-10 — Pas de TVA en dur, et TVA éventuellement non applicable. TRANCHÉE quant au mécanisme.**
Le paramètre `tva.applicable` (booléen) et `tva.taux_pb` pilotent le calcul. Les prix saisis et affichés sont **TTC** par défaut (`prix.saisie_ttc = true`).

Le régime fiscal de l'entreprise détermine le réglage :

| Régime                             | `tva.applicable` | `tva.taux_pb` |
| ----------------------------------- | ------------------ | --------------- |
| Impôt général synthétique (IGS) | `false`          | sans objet      |
| Régime du réel                    | `true`           | `1925`        |

Le code ne présume d'aucun des deux : il lit les paramètres. **Le régime réel de l'entreprise doit être confirmé avant la mise en service**, pas avant de coder (§10, Q-02).

La **facturation électronique** (transmission DGI) est hors V1 et rattachée à U10, avec la facture A4.

**DEC-11 — Indépendance du matériel.**
Aucun parcours fonctionnel ne dépend d'un périphérique précis. Le matériel est atteint par des adaptateurs remplaçables, et l'absence d'un périphérique dégrade le service sans jamais le bloquer.

- **Lecteur de codes-barres** : absent chez le premier client. La recherche texte et le code interne sont les chemins de saisie de référence (EF-U2-02, EF-U3-10). Le champ `code_barres` reste au schéma pour la revente.
- **Imprimante** : thermique 80 mm en **USB**, pilotée en ESC/POS derrière un adaptateur. Aucune marque n'est câblée dans le code. Une imprimante absente ou en panne ne bloque jamais une vente (EF-U4-04, EF-U4-06).
- **Tiroir-caisse** : voir DEC-12.
  Le choix des modèles exacts se fait pour la preuve de concept, pas avant (§10, Q-03).

**DEC-12 — Tiroir-caisse électronique : absent en V1, prévu au modèle.**
Le premier client n'en a pas. La table `ouvertures_tiroir` et l'alerte AL-21 (ouverture sans vente associée) sont néanmoins **implémentées et testées**, mais inactives tant qu'aucun tiroir n'est déclaré dans `parametres`. Motif : c'est l'un des signaux de détournement d'espèces les plus classiques, et le rajouter après coup obligerait à rouvrir le schéma append-only. Le coût de le prévoir maintenant est faible ; celui de l'ajouter plus tard ne l'est pas (EF-U4-07).

**DEC-13 — Le rôle `gerant` est tournant, pas nominatif.**
Il n'y a pas une personne « le gérant ». Le propriétaire tient ce rôle quand il est en boutique ; un employé désigné le tient quand le propriétaire se déplace. Conséquences : le rôle est **assignable et révocable** par le propriétaire depuis la caisse, toute assignation est tracée dans `journal_audit`, et l'alerte AL-22 signale une période où personne ne porte le rôle alors que la boutique est ouverte (EF-U0-09).

**DEC-14 — Horaires d'ouverture.**
Lundi à samedi, **07:00 – 18:00**. Le dimanche, ouverture **occasionnelle et réservée au propriétaire** : une vente dominicale par un vendeur ou un gérant déclenche AL-17, une vente dominicale par le propriétaire ne la déclenche pas. Les horaires vivent dans `magasin.horaires` (§9) et ne sont jamais en dur.

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

**EF-U0-09 — Assignation du rôle `gerant` (DEC-13).** Le propriétaire peut assigner et révoquer le rôle `gerant` depuis la caisse, sans réseau. Le rôle est porté par zéro ou un utilisateur à la fois.

- Étant donné un employé de rôle `vendeur`, quand le propriétaire lui assigne le rôle `gerant` avec son PIN, alors l'employé obtient les permissions gérant (§2.2), une entrée `journal_audit` `ROLE_ASSIGNE` enregistre l'auteur, le bénéficiaire et l'horodatage, et la révocation écrit symétriquement `ROLE_REVOQUE`.
- Étant donné qu'aucun utilisateur ne porte le rôle `gerant` et que le propriétaire n'est pas en session, quand la boutique est dans ses horaires d'ouverture (DEC-14), alors AL-22 est émise.

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

*Saisie d'un catalogue très large (Q-08, DEC-11, ENF-16)*

> Le catalogue du premier client est très étendu et n'existe aujourd'hui que dans le **registre papier du propriétaire**. Il n'y a **pas de lecteur de codes-barres**. La saisie est donc le vrai goulot d'étranglement de U2, pas l'import : les exigences ci-dessous existent pour que saisir plusieurs milliers de références reste faisable par une personne non technique.

**EF-U2-06 — Création minimale.** Un article est créable avec **quatre** champs seulement : désignation, unité de base, prix de vente de référence, prix plancher. Tout le reste (catégorie, emplacement, seuil d'alerte, synonymes, code-barres, prix d'achat) est facultatif à la création. Le `code_interne` est généré automatiquement s'il n'est pas fourni (EF-U2-04).

**EF-U2-07 — Saisie en série.** Après validation d'un article, le formulaire se rouvre vide en conservant catégorie, unité de base et emplacement de l'article précédent, et le curseur retourne au champ désignation. Aucun retour à une liste entre deux créations.

- Étant donné un opérateur saisissant 20 articles de la même catégorie, quand il valide chaque article, alors il ne ressaisit ni la catégorie, ni l'unité de base, ni l'emplacement.

**EF-U2-08 — Duplication.** Un article existant peut être dupliqué : tous les champs sont repris, la désignation et le `code_interne` sont vidés, la quantité en stock n'est **jamais** reprise.

**EF-U2-09 — Complétude différée.** Un article créé au minimum est immédiatement vendable. Un écran « articles à compléter » liste ceux dont un champ recommandé manque (prix d'achat, seuil d'alerte, emplacement), triés par nombre de ventes décroissant — on complète d'abord ce qui tourne.

- Un article sans prix d'achat a un CUMP nul : sa marge n'est pas calculée et il est exclu des alertes AL-11, sans bloquer la vente.

**EF-U2-10 — Correction sans rupture.** Modifier la désignation, le prix ou l'unité de vente d'un article **ne modifie jamais** les lignes de vente déjà enregistrées, qui portent leurs propres valeurs figées (§3 « lignes_vente »). Toute modification de prix ou de plancher écrit une entrée `journal_audit`.

**EF-U2-11 — Prix conseillés en multiples de 50 (RG-01, Q-07).** À la saisie d'un prix de vente ou d'un plancher, l'interface **suggère** l'arrondi au multiple de `prix.multiple_conseille` (défaut 50) le plus proche, et affiche l'écart. La suggestion est **refusable** : aucun prix n'est jamais imposé ni corrigé d'office.

**EF-U2-12 — Synonymes à la saisie.** Le champ `designation_alt` accepte plusieurs synonymes séparés par des virgules et alimente la recherche (EF-U2-02). C'est le mécanisme qui compense l'absence de lecteur de codes-barres : « fer 8 », « fer à béton 8 », « TOR 8 » trouvent le même article.

### U3 — Caisse hors ligne et sessions

*Ouverture*

**EF-U3-01 — Écran d'accueil.** Sans session ouverte, la caisse n'affiche que l'écran « Ouvrir la caisse ». Aucune vente n'est possible.

**EF-U3-02 — Ouverture.** L'opérateur choisit son nom, saisit son PIN, puis compte le fond **à l'aveugle**. Le système compare ensuite au `fond_laisse` de la session précédente et enregistre `ecart_ouverture`. Si l'écart d'ouverture ≠ 0, AL-02 est émise.

**EF-U3-03 — Une seule session ouverte par caisse.** Si une session est déjà ouverte par une autre personne, l'ouverture est refusée ; seul un gérant ou le propriétaire peut forcer sa fermeture (EF-U3-33).

**EF-U3-04 — Nom de l'opérateur visible en permanence** dans l'en-tête de l'écran de caisse.

*Vente*

**EF-U3-10 — Ajout d'article (révisée, DEC-11).** Par **recherche texte** ou **code interne** — ce sont les deux chemins de référence, le premier client n'ayant **pas** de lecteur de codes-barres. Le scan reste pris en charge si un lecteur est branché (il se comporte comme une saisie clavier du code-barres), mais aucun parcours n'en dépend et aucun test ne le présuppose. Choix de l'unité de vente ; quantité décimale autorisée uniquement pour les unités de base mètre, kg, litre.

**EF-U3-11 — Modification du prix.** L'opérateur peut modifier le prix unitaire d'une ligne. Si le prix est sous le plancher, l'écran exige un motif (liste + texte libre) avant de continuer.

**EF-U3-12 — Mise en attente.** Jusqu'à 5 paniers en attente simultanés par session, persistés localement. Un panier en attente à la clôture **DOIT** être repris ou abandonné avant de fermer.

**EF-U3-13 — Encaissement (révisée, Q-09).** Modes : `especes`, `camtel`, `mtn_momo`, `orange_money`, `virement` — les **trois** opérateurs Camtel, MTN et Orange doivent être proposés. La liste vit dans `parametres` (`modes_paiement`, §9) et n'est jamais en dur. Plusieurs paiements par vente. Pour tout paiement mobile, la référence de transaction est **obligatoire** (saisie manuelle en V1 ; aucune intégration d'API opérateur). Le montant encaissé en espèces est arrondi selon RG-01 ; les autres modes ne le sont jamais.

**EF-U3-14 — Suppressions avant encaissement.** La suppression d'une ligne et l'abandon d'un panier sont autorisés, et **chacun** écrit un événement `journal_audit` (`LIGNE_SUPPRIMEE_AVANT_ENCAISSEMENT`, `PANIER_ABANDONNE`) avec le contenu supprimé.

**EF-U3-15 — Validation atomique.** Une seule transaction locale écrit : la vente, ses lignes, ses paiements, les mouvements de stock `SORTIE_VENTE` (valorisés au CUMP courant), le mouvement de caisse implicite, l'entrée d'audit et les événements `outbox`. L'écran « Vente validée » ne s'affiche **qu'après** le commit.

- Étant donné une coupure d'alimentation simulée à n'importe quel point de la transaction, quand l'application redémarre, alors soit la vente existe entièrement, soit elle n'existe pas du tout, et le panier est toujours présent.

**EF-U3-16 — Performance.** Voir ENF-01.

**EF-U3-17 — Saisie sans lecteur de codes-barres (DEC-11, ENF-16).** L'ajout d'un article au ticket se fait **sans quitter le clavier** : la frappe alimente directement la recherche, les flèches parcourent les résultats, la validation ajoute la ligne et rend le focus au champ de recherche. La quantité est saisissable dans la foulée, sans pointer l'écran.

- Étant donné un catalogue de 10 000 articles et un opérateur formé, quand il ajoute un article par sa désignation partielle, alors l'article est au ticket en **moins de 5 s** sans aucune interaction tactile hors clavier.
- L'écran tactile reste un chemin équivalent et complet : le clavier est un accélérateur, jamais un prérequis.

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

**EF-U4-06 — Indépendance de l'imprimante (DEC-11).** L'impression passe par une interface `Imprimante` implémentée par un adaptateur ESC/POS **USB**, sélectionné dans `parametres`. Aucune marque ni référence de modèle n'apparaît dans `domain` ni dans le code d'interface.

- Étant donné l'adaptateur remplacé par une implémentation d'aperçu, quand la suite de tests s'exécute, alors tous les parcours d'impression passent sans imprimante physique (EF-U4-05).
- Le passage d'un modèle USB à un autre ne modifie que la configuration de l'adaptateur.

**EF-U4-07 — Tiroir-caisse : prévu, inactif (DEC-12).** L'impulsion d'ouverture de tiroir est émise par l'adaptateur d'impression **uniquement** si un tiroir est déclaré dans `parametres` (`caisse.tiroir_present`, défaut `false`). Chaque ouverture écrit une ligne `ouvertures_tiroir` avec la vente associée quand il y en a une.

- Étant donné `caisse.tiroir_present = false`, quand une vente est validée, alors aucune impulsion n'est émise, aucune ligne `ouvertures_tiroir` n'est écrite, et AL-21 ne peut pas se déclencher.
- Étant donné `caisse.tiroir_present = true`, quand le tiroir s'ouvre sans vente associée, alors AL-21 est émise.
- Le code et les tests de ce chemin existent en V1 même si le premier client n'a pas de tiroir.

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

### U7 — Approvisionnement

**EF-U7-01 — Réception directe.** L'opérateur enregistre une réception de marchandise : fournisseur, date, puis une ligne par article avec quantité reçue et coût unitaire réel. **Aucune commande préalable n'est gérée en V1** (Q1 de l'analyse des exigences).
- Étant donné une réception de 10 sacs de ciment à 5 200 FCFA, quand elle est validée, alors 10 mouvements `ENTREE_ACHAT` existent pour ces articles au coût saisi, et le CUMP est recalculé selon RG-11.

**EF-U7-02 — Fournisseur minimal.** Fiche fournisseur réduite au nom et au téléphone. **Aucun suivi de dette fournisseur en V1** ; le champ `solde` du cadrage n'est pas alimenté.

**EF-U7-03 — Immutabilité.** Une réception validée n'est jamais modifiée ni supprimée. Une erreur se corrige par une réception inverse, datée du jour, avec motif obligatoire.

**EF-U7-04 — Rôles.** Réception réservée aux rôles `gerant` et `proprietaire`. Le coût unitaire saisi n'est jamais visible d'un vendeur (§2.2, DEC-01).

**EF-U7-05 — Atomicité.** Une seule transaction locale écrit la réception, ses lignes, les mouvements de stock, l'entrée d'audit et les événements `outbox`.

### U8 — Clients et crédit

**EF-U8-01 — Fiche client.** Nom et téléphone uniquement. Aucune autre donnée personnelle n'est conservée (faisabilité Q9).

**EF-U8-02 — Plafond de crédit.** Chaque client porte un plafond, paramétrable, exprimé en FCFA entiers.

**EF-U8-03 — Paiement à crédit.** Le mode `credit` est proposé à l'encaissement et exige un client. Il peut être combiné à d'autres modes dans la même vente (RG-06 s'applique aux seuls modes encaissés).

**EF-U8-04 — Dépassement de plafond.** Si la vente porte le solde du client au-delà de son plafond, elle est refusée. Une **dérogation par PIN du propriétaire** l'autorise ; `journal_audit` enregistre alors l'opérateur de la session **et** l'auteur de la dérogation.
- Étant donné un client dont le plafond est 50 000 FCFA et le solde 45 000, quand une vente à crédit de 10 000 est tentée sans dérogation, alors elle est refusée et aucune écriture n'est faite.

**EF-U8-05 — Remboursement.** Un remboursement partiel ou total est enregistré dans tout mode encaissable, rattaché à la session de caisse en cours, et écrit un mouvement de caisse si c'est en espèces.

**EF-U8-06 — Compte client à ajout seul.** `mouvements_compte_client` est append-only. Le solde est **calculé** par somme des mouvements ; il n'est jamais stocké de façon mutable.

**EF-U8-07 — Consultation et relevé.** Écran du solde et de l'historique d'un client, avec relevé imprimable sur le ticket thermique.

### U10 — Facturation

**EF-U10-01 — Numérotation propre.** Une facture porte un numéro issu d’une **séquence distincte de celle des tickets**, continue, chronologique et sans trou, par caisse et par année. La continuité sans trou est une règle **présumée** (hypothèse H6 de `requirements.md`), rapportée par des guides spécialisés et non vérifiée dans le texte officiel (Q3 et Q7 de l'analyse des exigences).

**EF-U10-02 — Deux supports au choix.** À l'impression, l'opérateur choisit entre le **ticket thermique 80 mm** et un **export PDF A4**. Les deux sont disponibles dès la V1.

**EF-U10-03 — Mentions obligatoires (présumées, hypothèse H2 de `requirements.md`).** Raison sociale et forme juridique, NIU, RCCM, adresse complète et coordonnées de l'entreprise, toutes lues depuis `parametres` ; NIU du client pour une vente à une entreprise ; mention **« TVA non applicable »**, le régime étant l'impôt général synthétique (DEC-10).

> Ces mentions proviennent de guides spécialisés, pas du texte officiel du Code général des impôts. **À faire valider par un comptable ou la DGI avant la mise en service** (hypothèse H2 de `requirements.md`).

**EF-U10-04 — Hors ligne.** La facture est produite et imprimée sans aucune dépendance au réseau.

**EF-U10-05 — Traçabilité.** Toute facture émise est tracée dans `journal_audit`. Une réimpression est marquée « DUPLICATA » et tracée (EF-U4-03).

---

## 6. Règles de calcul

Toutes ces règles vivent dans `packages/domain` et sont couvertes par des tests avec exemples chiffrés.

**RG-01 — Arrondi (révisée, Q-07).** Division entière arrondie au plus proche, demi vers le haut. Une seule fonction `arrondir(numerateur, denominateur)` dans `domain`, utilisée partout.

Arrondi des **encaissements en espèces** au multiple `caisse.arrondi_especes`, au plus proche. Ce paramètre représente la **plus petite pièce réellement en circulation chez le client** ; la valeur proposée est **25** FCFA, **à confirmer** (§10, Q-07). Avec `caisse.arrondi_especes = 1` le mécanisme est neutre.

- L'arrondi porte **uniquement** sur le montant à encaisser en espèces, jamais sur `total_ttc`, jamais sur une ligne, jamais sur le CUMP ni sur une marge.
- L'écart d'arrondi est enregistré sur la vente, pour que RG-20 reste exacte : une clôture ne doit pas afficher un manquant fictif fait de centimes d'arrondi.
- Un encaissement non espèces (mobile money, virement) n'est **jamais** arrondi.

À ne pas confondre avec `prix.multiple_conseille` (défaut 50), qui n'est qu'une **suggestion d'affichage** à la saisie d'un prix au catalogue (EF-U2-11) et n'entre dans aucun calcul.

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

| Code  | Déclencheur                                                                                                                                     | Sévérité                             | Paramètres (défaut)                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| AL-01 | \|écart de clôture\| > seuil                                                                                                                   | haute si manquant, moyenne si excédent | `caisse.seuil_ecart` (2 000)                                                                                    |
| AL-02 | Écart d'ouverture ≠ 0                                                                                                                          | moyenne                                 | —                                                                                                                |
| AL-03 | Fermeture forcée d'une session                                                                                                                  | moyenne                                 | —                                                                                                                |
| AL-04 | Annulation après encaissement                                                                                                                   | haute                                   | —                                                                                                                |
| AL-05 | Vente sous plancher au-delà du seuil                                                                                                            | moyenne                                 | `alertes.sous_plancher_pb` (1 000 = 10 %)                                                                       |
| AL-06 | Manquants répétés sous le seuil : sur les N dernières sessions d'un opérateur, au moins K manquants chacun ≤ seuil, dont la somme ≥ cumul | haute                                   | `alertes.fenetre_sessions` (10), `alertes.nb_manquants_min` (3), `alertes.cumul_manquants` (5 000)          |
| AL-07 | Opérateur atypique : taux d'annulation, de remise ou de vente sous plancher > facteur × médiane des autres opérateurs sur 30 jours           | moyenne                                 | `alertes.facteur_atypique` (3), `alertes.echantillon_min` (50) ; non calculé s'il y a moins de 2 opérateurs |
| AL-08 | Ajustement manuel de stock                                                                                                                       | basse ; moyenne si valeur > seuil       | `alertes.ajustement_valeur` (10 000)                                                                            |
| AL-09 | Stock théorique négatif                                                                                                                        | basse                                   | —                                                                                                                |
| AL-10 | Sorties d'espèces d'une session > facteur × moyenne des 20 dernières sessions                                                                 | moyenne                                 | `alertes.facteur_sorties` (2), minimum 5 sessions d'historique                                                  |
| AL-11 | Marge moyenne d'un opérateur inférieure à la médiane de plus de X points sur 30 jours                                                        | moyenne                                 | `alertes.ecart_marge_pb` (500)                                                                                  |
| AL-12 | Blocage après échecs de PIN                                                                                                                    | moyenne                                 | 5 échecs / 10 min                                                                                                |
| AL-13 | Trou dans la numérotation des tickets (serveur)                                                                                                 | haute                                   | —                                                                                                                |
| AL-14 | Nouvel appareil enregistré pour le propriétaire                                                                                                | haute                                   | —                                                                                                                |
| AL-15 | Aucune synchro depuis X min pendant les horaires d'ouverture                                                                                     | moyenne                                 | `sync.alerte_silence_min` (30)                                                                                  |
| AL-16 | Rupture non expliquée : stock atteint ≤ 0 par un mouvement autre qu'une vente                                                                  | moyenne                                 | —                                                                                                                |
| AL-17 | Vente hors horaires d'ouverture (DEC-14). Le dimanche,**non déclenchée** si l'opérateur de la session est le propriétaire              | moyenne                                 | `magasin.horaires`                                                                                              |
| AL-18 | Stock sous le seuil d'alerte de l'article                                                                                                        | basse                                   | `articles.seuil_alerte_stock`                                                                                   |
| AL-19 | Horloge de la caisse décalée de plus de X min par rapport au serveur (fraude possible sur les horaires)                                        | haute                                   | `sync.derive_horloge_min` (10)                                                                                  |
| AL-21 | Ouverture de tiroir sans vente associée.**Inactive** tant que `caisse.tiroir_present = false` (DEC-12, EF-U4-07)                        | haute                                   | `caisse.tiroir_present` (`false`)                                                                             |
| AL-22 | Aucun utilisateur ne porte le rôle`gerant` et le propriétaire n'est pas en session, pendant les horaires d'ouverture (DEC-13, EF-U0-09)      | moyenne                                 | `magasin.horaires`                                                                                              |

> AL-20 n'est pas attribuée : la numérotation saute de AL-19 à AL-21 pour que les codes déjà cités ailleurs restent stables.

Le tiroir-caisse n'est plus hors V1 : il est implémenté et testé, mais inactif par défaut (DEC-12).

Chaque alerte **DOIT** contenir : opérateur, session, entité liée, valeurs ayant déclenché la règle, valeur du paramètre au moment du déclenchement.

---

## 8. Exigences non fonctionnelles

| Code   | Exigence                                                                                                                                                                                                                                                                                                                                                     | Méthode de vérification                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| ENF-01 | Vente de 3 articles (recherche, ajout, encaissement espèces) en**< 20 s** par un opérateur formé ; chaque action d'interface < 100 ms ; validation < 300 ms                                                                                                                                                                                         | Médiane de 10 essais chronométrés sur la tablette cible ; mesures automatiques Playwright                     |
| ENF-02 | Recherche d'article < 200 ms (p95) sur 10 000 articles                                                                                                                                                                                                                                                                                                       | Test de performance sur la tablette cible                                                                        |
| ENF-03 | Démarrage à froid < 5 s                                                                                                                                                                                                                                                                                                                                    | Mesure sur la tablette cible                                                                                     |
| ENF-04 | Zéro perte d'une vente validée en cas de coupure                                                                                                                                                                                                                                                                                                           | 100 arrêts forcés aléatoires pendant une série de ventes                                                     |
| ENF-05 | 60 jours ou 30 000 ventes sans synchro, sans dégradation de plus de 20 % des temps ENF-01/02                                                                                                                                                                                                                                                                | Test de charge sur base de seed volumineuse                                                                      |
| ENF-06 | Cibles tactiles ≥ 48 dp ; texte ≥ 16 sp ; montants ≥ 24 sp ; contraste ≥ 7:1 sur l'écran de caisse ; tablette 10" portrait et paysage                                                                                                                                                                                                                   | Revue visuelle et contrôle automatique du contraste                                                             |
| ENF-07 | Interface en français ; montants au format « 12 500 FCFA » ; dates JJ/MM/AAAA ; horodatages stockés en UTC, affichés en`Africa/Douala`                                                                                                                                                                                                                | Tests unitaires des formateurs                                                                                   |
| ENF-08 | Base locale chiffrée ; TLS 1.2+ ; jetons révocables ; aucun secret dans le dépôt ; aucun PIN, prix d'achat ou jeton dans les logs                                                                                                                                                                                                                        | Recherche de secrets dans les contrôles git avant chaque envoi, puis en intégration continue (NFR20) ; revue de code |
| ENF-09 | < 1 Ko compressé par vente synchronisée en moyenne                                                                                                                                                                                                                                                                                                         | Mesure sur le seed                                                                                               |
| ENF-10 | Export chiffré quotidien automatique ; restauration testée                                                                                                                                                                                                                                                                                                 | Test automatisé sauvegarde → restauration → comparaison, lancé avant chaque jalon (NFR19), puis en intégration continue (NFR20) |
| ENF-11 | TypeScript strict, aucun`any` ; couverture `domain` ≥ 90 % (lignes et branches) ; E2E ouverture → vente → annulation → sortie d'espèces → clôture                                                                                                                                                                                                 | Contrôles git bloquants avant chaque envoi, puis intégration continue bloquante ajoutée avant l’installation en boutique (NFR18) |
| ENF-12 | Logs serveur structurés (tenant, magasin, caisse, version, id de requête)                                                                                                                                                                                                                                                                                  | Revue                                                                                                            |
| ENF-13 | Installation chez un nouveau client en < 1 h, import compris                                                                                                                                                                                                                                                                                                 | Répétition chronométrée avec le seed                                                                         |
| ENF-14 | Le mot « quincaillerie » n'apparaît dans aucun fichier de code                                                                                                                                                                                                                                                                                            | Contrôle automatique avant chaque commit, puis en intégration continue (NFR20) ; périmètre `apps/`, `packages/` et configuration racine, seed exclu |
| ENF-15 | **Parité des deux cibles** (DEC-02) : le parcours E2E complet (ouverture → vente → annulation → sortie d'espèces → clôture) passe à l'identique sur la cible **Capacitor/Android** et sur la cible **Electron**. Aucune règle métier, aucun calcul et aucun écran ne diffère entre les deux ; seuls les adaptateurs diffèrent | Même suite E2E exécutée sur les deux cibles avant chaque jalon (NFR19), puis en intégration continue (NFR20) ; échec bloquant sur l’une ou l’autre |
| ENF-16 | **Ergonomie de saisie à grand volume** (Q-08, DEC-11) : créer 50 articles au minimum requis (EF-U2-06) prend moins de **15 min** à un opérateur formé, sans lecteur de codes-barres ; ajouter un article au ticket prend moins de **5 s** au clavier seul (EF-U3-17)                                                                  | Chronométrage sur la cible réelle, médiane de 3 essais ; mesure automatique Playwright pour l'ajout au ticket |
| ENF-17 | **Résistance à la coupure d'alimentation** (§1.4) : sur les deux cibles, une coupure à n'importe quel instant ne perd aucune vente validée (ENF-04) et le redémarrage restaure le panier en cours. Sur tablette, la batterie assure la continuité ; sur poste fixe, l'onduleur est une exigence d'installation documentée                      | 100 arrêts forcés aléatoires par cible ; procédure d'installation vérifiée en recette                      |

---

## 9. Paramètres et valeurs par défaut

Toutes ces valeurs sont des **propositions à valider** (Q-06). Stockées dans `parametres`, surchargeables par magasin.

| Clé                                 | Défaut                                                                                          | Rôle                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `devise`                           | `XAF`                                                                                          | Devise                                                                 |
| `tva.applicable`                   | `true`                                                                                         | Active le calcul de TVA                                                |
| `tva.taux_pb`                      | `1925`                                                                                         | Taux de TVA (à confirmer, Q-02)                                       |
| `prix.saisie_ttc`                  | `true`                                                                                         | Les prix saisis sont TTC                                               |
| `caisse.seuil_ecart`               | `500`                                                                                          | AL-01. Fixé par le propriétaire (Q-06), à revoir après observation |
| `caisse.arrondi_especes`           | `25`                                                                                           | RG-01. Plus petite pièce en circulation,**à confirmer** (Q-07) |
| `prix.multiple_conseille`          | `50`                                                                                           | EF-U2-11. Suggestion d'affichage seulement, n'entre dans aucun calcul  |
| `caisse.tiroir_present`            | `false`                                                                                        | DEC-12, EF-U4-07, AL-21                                                |
| `caisse.max_paniers_attente`       | `5`                                                                                            | EF-U3-12                                                               |
| `caisse.verrouillage_inactivite_s` | `120`                                                                                          | DEC-07                                                                 |
| `caisse.motifs_sortie`             | `["Fournisseur","Transport","Course","Avance salaire","Autre"]`                                | EF-U3-30                                                               |
| `caisse.motifs_sous_plancher`      | `["Client fidèle","Quantité importante","Alignement concurrence","Article abîmé","Autre"]` | EF-U3-11                                                               |
| `magasin.horaires`                 | lun–sam 07:00–18:00 ; dim. fermé sauf ouverture du propriétaire                              | AL-17, AL-22, DEC-14                                                   |
| `modes_paiement`                   | `["especes","camtel","mtn_momo","orange_money","virement"]`                                    | EF-U3-13, EF-U6-10, §1.4                                              |
| `rapport.heure_limite`             | `21:00`                                                                                        | EF-U5-05                                                               |
| `alertes.*`                        | cf. §7                                                                                          | Règles d'alerte                                                       |
| `sync.alerte_silence_min`          | `30`                                                                                           | AL-15                                                                  |
| `sync.derive_horloge_min`          | `10`                                                                                           | AL-19                                                                  |
| `ticket.pied`                      | « Merci de votre visite »                                                                      | EF-U4-01                                                               |
| `numerotation.format`              | `{caisse}-{annee}-{seq:6}`                                                                     | DEC-05                                                                 |

---

## 10. Questions ouvertes — état

Les onze questions ont été tranchées par le propriétaire. Ce tableau conserve la question, la réponse, l'endroit où elle est traduite dans ce document, et ce qui **reste** à faire.

| Code | Réponse retenue                                                                                                                                                                                       | Traduit dans                           | Reste à faire                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-01 | La caisse tourne sur ordinateur**et** sur tablette ; les coupures de courant sont prises en compte. **Capacitor** (tablette Android) + **Electron** (ordinateur), tout en TypeScript | §1.4, DEC-02, DEC-11, ENF-15, ENF-17  | **Preuve de concept sur les deux cibles** avant d'engager U0                                                                                                               |
| Q-02 | `tva.applicable = false` si régime IGS ; `true` avec `tva.taux_pb = 1925` si régime réel. Facturation électronique reportée en U10                                                          | DEC-10                                 | **Confirmer le régime réel de l'entreprise avant la mise en service**                                                                                                    |
| Q-03 | Pas de lecteur de codes-barres ; imprimante**USB** ; l'application reste indépendante du matériel                                                                                              | §1.4, DEC-11, EF-U3-10, EF-U4-06      | Choisir les modèles exacts pour la preuve de concept                                                                                                                            |
| Q-04 | Pas de tiroir-caisse chez le premier client, mais prévu au modèle pour la revente                                                                                                                    | DEC-12, EF-U4-07, AL-21                | —                                                                                                                                                                               |
| Q-05 | Lundi–samedi 07:00–18:00 ; dimanche, ouverture occasionnelle réservée au propriétaire                                                                                                             | DEC-14, AL-17, §9                     | Liste des jours fériés observés                                                                                                                                               |
| Q-06 | Seuil d'écart de caisse :**500 FCFA**. Autres seuils : valeurs par défaut du §9                                                                                                               | §7, §9                               | **Durée d'observation à clarifier** : la réponse dit « 4 semaines d'observation » puis « revoir après 1 semaine ». Les deux lectures sont possibles — à trancher |
| Q-07 | Prix conseillés en multiples de**50** ; encaissements espèces arrondis au plus proche sur la plus petite pièce utilisée                                                                      | RG-01, EF-U2-11, §9                   | **Confirmer la plus petite pièce** — `caisse.arrondi_especes = 25` est une valeur proposée, pas confirmée                                                            |
| Q-08 | Catalogue très large ; les produits viennent du registre papier du propriétaire ; la saisie doit être facile                                                                                        | EF-U2-06 à EF-U2-12, EF-U3-17, ENF-16 | Préparer le registre ; estimer le nombre de références pour dimensionner U2                                                                                                   |
| Q-09 | **Camtel**, **MTN** et **Orange** doivent tous les trois fonctionner                                                                                                                 | §1.4, EF-U3-13,`modes_paiement`     | —                                                                                                                                                                               |
| Q-10 | PostgreSQL local via**Docker** en développement ; **VPS en Europe de l'Ouest** en production                                                                                              | §1.4                                  | **Choisir l'hébergeur avant U6**                                                                                                                                          |
| Q-11 | Le rôle`gerant` est tournant : le propriétaire quand il est présent, un employé quand il se déplace                                                                                             | DEC-13, EF-U0-09, AL-22                | —                                                                                                                                                                               |

**Conséquence de Q-10 sur le périmètre.** Un VPS de production est un serveur réel à provisionner, durcir, sauvegarder et déployer. Ce n'était pas le cas dans la lecture initiale « une boutique, une tablette ». U6 et les ENF-08/10/12 portent désormais un vrai volet serveur.

---

## 11. Découpage en unités de travail pour AI-DLC

| Unité        | Dépend de | Exigences couvertes             | Démontrable au propriétaire       |
| ------------- | ---------- | ------------------------------- | ----------------------------------- |
| U0 Socle      | —         | EF-U0-*, DEC-01 à DEC-10 (ADR) | Non                                 |
| U1 Domaine    | U0         | EF-U1-*, RG-*, AL-* (logique) | Non (suite de tests)                |
| U2 Catalogue  | U0, U1     | EF-U2-*                         | Oui : ses articles dans le système |
| U3 Caisse     | U1, U2     | EF-U3-*, ENF-01 à 07           | Oui : une vraie journée de ventes  |
| U4 Impression | U3         | EF-U4-*                         | Oui : tickets papier                |
| U5 Anti-vol   | U3         | EF-U5-*, AL-* (branchement)   | Oui : alertes et rapport imprimé   |
| U6 Synchro    | U3, U5     | EF-U6-*, ENF-08 à 10           | Oui : suivi sur son téléphone     |
| U7 Approvision. | U1, U2     | EF-U7-*                         | Oui : une réception réelle          |
| U8 Crédit      | U3         | EF-U8-*                         | Oui : une vente à crédit suivie     |
| U10 Facturation | U3         | EF-U10-*                        | Oui : une facture conforme          |

Règles de passage (révisées) : la règle « une unité ne démarre qu'après l'usage réel de la précédente en boutique » est **retirée**. On construit toute la V1, on la teste hors boutique sur les données de démonstration, puis on installe en une fois. Chaque unité se termine par : tests verts, ADR à jour, démonstration au propriétaire.

---

## 12. Glossaire français-anglais

Le code est écrit **en anglais** — identifiants, tables, colonnes, fonctions du domaine et clés de paramètres — tandis que **tout ce que voit l'utilisateur reste en français** : interface, tickets, rapports, documents. Ce document conserve les noms français ; ce glossaire fait le lien avec le code. Il est tenu à jour à chaque nouvelle entité.

### Tables

| Document (français) | Code (anglais) |
|---|---|
| `tenants`, `magasins`, `caisses`, `utilisateurs`, `parametres` | `tenants`, `stores`, `registers`, `users`, `settings` |
| `categories`, `articles`, `unites_vente` | `categories`, `products`, `selling_units` |
| `mouvements_stock`, `stock_actuel` | `stock_movements`, `stock_levels` |
| `sessions_caisse`, `mouvements_caisse`, `ouvertures_tiroir` | `register_sessions`, `cash_movements`, `drawer_openings` |
| `paniers`, `lignes_panier` | `carts`, `cart_lines` |
| `ventes`, `lignes_vente`, `paiements` | `sales`, `sale_lines`, `payments` |
| `clients`, `mouvements_compte_client` | `customers`, `customer_account_entries` |
| `fournisseurs`, `receptions`, `lignes_reception` | `suppliers`, `goods_receipts`, `goods_receipt_lines` |
| `factures` | `invoices` |
| `journal_audit`, `alertes` | `audit_log`, `alerts` |
| `outbox`, `curseurs_sync`, `appareils_confiance`, `tentatives_pin` | `outbox`, `sync_cursors`, `trusted_devices`, `pin_attempts` |

### Fonctions du domaine

| Document (français) | Code (anglais) |
|---|---|
| `quantiteStock`, `etatStockAu` | `stockQuantity`, `stockAt` |
| `versUniteBase` | `toBaseUnit` |
| `arrondir` | `roundDiv` |
| `evaluerAlertes`, `evaluerAlertesPeriodiques` | `evaluateAlerts`, `evaluatePeriodicAlerts` |
| `rapportJournalier` | `dailyReport` |

### Termes métier

| Français | Anglais |
|---|---|
| CUMP (coût unitaire moyen pondéré) | `weightedAverageCost` |
| Prix plancher | `floorPrice` |
| Fond initial, fond laissé, versement | `openingFloat`, `closingFloat`, `handover` |
| Espèces théoriques, écart | `expectedCash`, `variance` |
| Comptage à l'aveugle | `blindCount` |
| Unité de base, unité de vente | `baseUnit`, `sellingUnit` |
| Session de caisse | `registerSession` |
| Réception de marchandise | `goodsReceipt` |
| Plafond de crédit, solde client | `creditLimit`, `customerBalance` |

### Clés de paramètres

Les clés restent structurées de la même façon, en anglais : `register.varianceThreshold` (ex-`caisse.seuil_ecart`), `register.cashRounding` (ex-`caisse.arrondi_especes`), `pricing.suggestedMultiple`, `register.drawerPresent`, `store.openingHours`, `vat.applicable`, `vat.rateBp`, `sync.silenceAlertMin`, `sync.clockDriftMin`.

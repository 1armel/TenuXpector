# Spécifications — Logiciel de gestion de quincaillerie

Document de cadrage destiné à servir de référence pour le développement (avec Claude Code).
Objectif double : équiper la quincaillerie familiale, et disposer d'une base réutilisable et revendable à d'autres commerces de détail.

---

## 1. Contexte et contraintes réelles

| Contrainte | Conséquence sur la conception |
|---|---|
| Pas de wifi dans la boutique, seul le téléphone du gérant est connecté | La caisse doit fonctionner **100 % hors ligne** pendant des jours. La synchro est un bonus, pas un prérequis. |
| Électricité irrégulière | Aucune opération ne doit être perdue sur coupure. Écriture locale immédiate, pas de « panier en mémoire ». |
| Une seule personne à la caisse, mais **elle change souvent** (le père, un employé, un frère) | La question centrale n'est pas « qui a accès » mais « **qui tenait la caisse à ce moment précis** ». Le modèle de session de poste est obligatoire. |
| Suivi temps réel souhaité sur le téléphone du gérant, **et sur le sien uniquement** | La contrainte est côté caisse, pas côté gérant : c'est l'appareil du comptoir qui doit pouvoir émettre. Solution retenue : carte SIM dans la tablette de caisse (§8). L'accès au tableau de bord est réservé au rôle `proprietaire` et lié à un appareil de confiance (§4.3). |
| Anti-vol demandé dès la V1 | L'auditabilité n'est pas un module ajouté après coup, elle est dans le schéma de base. |
| Marché : Douala, quincaillerie | Marchandage, vente au crédit, unités multiples, articles sans code-barres, paiements mobile money. |

---

## 2. Les cinq décisions d'architecture structurantes

### 2.1 Le stock est un journal immuable, jamais un compteur

Interdiction absolue de stocker `article.quantite` et de faire `UPDATE ... SET quantite = quantite - 3`.

Toute variation de stock est une **ligne insérée** dans `mouvements_stock`, jamais modifiée ni supprimée. La quantité disponible est la somme des mouvements, avec un cache recalculable dans `stock_actuel`.

Ce seul choix te donne gratuitement :
- la traçabilité anti-vol (chaque unité manquante a un auteur ou un trou identifiable) ;
- la synchronisation hors ligne sans conflit (deux caisses qui insèrent des lignes ne se marchent pas dessus, contrairement à deux caisses qui écrivent un compteur) ;
- la reconstruction de l'état du stock à n'importe quelle date passée ;
- la valorisation comptable du stock.

**Confirmation par l'existant.** ERPNext a opéré exactement ce basculement en version 13, en rendant le grand livre des stocks et le grand livre comptable immuables. Leur raisonnement mérite d'être connu : une annulation ne supprime plus rien, elle génère une écriture inverse **datée du jour de l'annulation**, ce qui permet de ne jamais rouvrir une période close.

**Le piège qu'ils ont rencontré, et comment on l'évite.** ERPNext a dû interdire les écritures de stock antidatées, parce qu'en valorisation FIFO, insérer un mouvement dans le passé oblige à recalculer toute la séquence suivante, ce qui bouleverse les valorisations et les marges déjà publiées.

Deux conséquences pour nous :

1. **Choisir le coût moyen pondéré, pas le FIFO.** Le CUMP se recalcule de façon incrémentale et ne souffre pas des insertions tardives. Pour une quincaillerie, la précision du FIFO n'apporte rien. Décision assumée, à documenter dans un ADR.
2. **Un seul écrivain par magasin.** Comme une boutique n'a qu'une caisse, il n'existe jamais deux flux concurrents pour le même stock. Une caisse qui synchronise avec trois jours de retard n'entre donc en conflit avec personne : le serveur reçoit une séquence déjà ordonnée. C'est ce qui rend le mode hors ligne prolongé sans danger. Si un jour un client veut deux caisses dans le même magasin, il faudra trancher explicitement l'ordonnancement, ne pas laisser ce cas arriver par accident.

### 2.2 Modèle de session de poste

Personne ne « se connecte » à l'application. Quelqu'un **ouvre un poste**, et le referme.

- Ouverture : identification par code PIN + saisie du fond de caisse compté.
- Toutes les ventes, remises, annulations et ajustements de la journée sont rattachés à cette session.
- Fermeture : comptage des espèces, comparaison avec le théorique, écart enregistré et non modifiable.

**Comptage à l'aveugle.** L'opérateur saisit ce qu'il a compté **avant** que le système n'affiche le montant théorique. C'est une pratique standard en prévention des pertes : si la personne voit le total attendu, elle ajuste sa déclaration pour le faire correspondre, et le contrôle ne détecte plus rien. L'ordre des écrans compte autant que le calcul.

**Mouvements d'espèces en cours de session.** Ton père sort de l'argent de la caisse dans la journée pour payer un fournisseur, un transporteur ou une course. Sans enregistrement de ces sorties, chaque clôture affiche un manquant fictif et le contrôle devient inexploitable. Il faut donc un bouton « entrée / sortie d'espèces » avec motif obligatoire, alimentant la table `mouvements_caisse`.

**La clôture ne dépend jamais du réseau.** C'est une erreur observée dans Odoo, où une session ne peut pas se fermer tant que toutes les commandes ne sont pas synchronisées, ce qui bloque le commerçant quand la connexion tombe. Chez nous, la clôture est un calcul purement local. La synchro suit, elle ne conditionne rien.

C'est le pivot de tout le dispositif anti-vol. Comme les opérateurs tournent, sans session tu ne peux jamais dire de qui vient un écart.

### 2.3 Offline-first, avec identifiants générés côté client

- Base locale sur l'appareil de caisse (SQLite), source de vérité pendant la journée.
- Chaque enregistrement porte un **UUID v7 généré localement**, jamais un auto-incrément serveur.
- File de synchronisation : les opérations sont poussées dans l'ordre, avec accusé de réception. Une opération déjà reçue est ignorée (idempotence par UUID).
- Le serveur ne renvoie jamais « ta vente est refusée » pour une vente déjà encaissée. Il l'accepte et signale une anomalie si besoin.
- Compteurs de numérotation (factures) : préfixe par appareil (`CAI1-2026-000123`) pour éviter les collisions hors ligne.

### 2.4 Multi-tenant dans le schéma, mono-client au déploiement

- Hiérarchie : `tenant` (l'entreprise cliente) → `magasin` (le point de vente) → `caisse` (l'appareil).
- `tenant_id` sur **toutes** les tables métier, et Row Level Security activée sur PostgreSQL.
- Zéro règle métier en dur : TVA, devise, arrondis, mentions de facture, unités, langue, tout est en table `parametres`.
- Tu ne construis ni l'inscription en ligne, ni la facturation SaaS, ni la console d'administration maintenant. Mais rien dans le schéma ne t'obligera à tout reprendre le jour où tu signes un deuxième client.

### 2.5 Cœur métier isolé et testé

Un package `domain` en TypeScript pur, sans accès base ni UI : calcul de stock, tarification, remises, TVA, marges, règles d'alerte.

C'est ce qui rend l'application réutilisable. Le jour où tu la vends à une pharmacie ou à un vendeur de pièces auto, tu changes la couche de configuration et une partie de l'UI, pas le cœur.

---

### 2.6 Le réseau est un transport interchangeable, pas une dépendance

L'application doit être vendable et utilisable dans une boutique sans aucune connectivité. La synchronisation n'est donc pas une fonctionnalité à activer, c'est un **canal de transport branchable** sur un moteur qui l'ignore.

**Règle fondatrice** : aucune fonctionnalité métier ne dépend du réseau. Ventes, stock, audit, calcul des alertes, rapport de clôture, tout est produit et consommé localement. Le réseau ne fait que déplacer des données déjà calculées.

**Pattern outbox.** Chaque mutation écrit deux choses dans la base locale, dans la même transaction : la donnée métier, et un événement dans `outbox`. Le moteur de synchro se contente de vider l'outbox. Si aucun transport n'est configuré, l'outbox s'accumule sans que rien ne casse.

**Interface de transport** dans `packages/sync` :

```ts
interface SyncTransport {
  readonly nom: string;
  disponible(): Promise<boolean>;
  pousser(lot: EvenementSortant[]): Promise<AccuseReception>;
  tirer(curseur: Curseur): Promise<EvenementEntrant[]>;
}
```

Trois implémentations, un seul moteur :

| Niveau | Transport | Ce que le gérant obtient | Coût |
|---|---|---|---|
| **0 — Autonome** | Aucun | Tout fonctionne sur la caisse. Alertes affichées à l'écran, rapport du jour imprimé au ticket de clôture. Suivi décalé, sur papier. | Nul |
| **1 — Proximité** | `LocalPeerTransport` : point d'accès local ou Bluetooth entre la tablette et le téléphone du gérant | Historique complet rapatrié sur son téléphone dès qu'il passe à la boutique, puis consultable hors ligne. Pas de temps réel. | Nul |
| **2 — Connecté** | `HttpServerTransport` : carte SIM dans la tablette | Temps réel, notifications push, sauvegarde serveur, multi-magasin. | Un petit forfait data |

Un quatrième transport `FileTransport` (export chiffré sur clé USB, ou fichier envoyé par messagerie) sert de secours et de mécanisme de sauvegarde pour le niveau 0.

**Curseur par transport.** Chaque transport garde sa propre position de lecture, ce qui permet à plusieurs de coexister : la tablette peut synchroniser avec le serveur *et* avec le téléphone du gérant sans se mélanger.

**Conséquence à ne pas rater sur l'anti-vol.** Les règles d'alerte s'exécutent dans `domain`, côté caisse, et écrivent dans la table locale `alertes`. La notification push n'est qu'un canal de livraison. Le dispositif anti-vol fonctionne donc intégralement au niveau 0, ce qui est essentiel puisque c'est la priorité de la V1.

**Conséquence sur les tests.** Le mode par défaut de la suite de tests est *hors ligne*. La synchronisation est testée en plus, jamais comme prérequis. Prévois un test qui coupe le transport au hasard en cours de série de ventes et vérifie qu'aucune donnée n'est perdue ni dupliquée.

**Conséquence commerciale.** Les trois niveaux forment une grille tarifaire naturelle. Un client démarre au niveau 0 sans abonnement, et monte quand il voit la valeur du suivi à distance.

---

## 3. Modèle de données

Notation : `PK` clé primaire, `FK` clé étrangère. Toutes les tables métier ont `tenant_id`, `created_at`, `created_by`, `device_id`.

### Socle

**tenants** — `id`, `raison_sociale`, `niu` (numéro d'identifiant unique), `rccm`, `telephone`, `adresse`, `devise` (XAF), `taux_tva`, `plan`, `actif`

**magasins** — `id`, `tenant_id` FK, `nom`, `adresse`, `telephone`, `actif`

**utilisateurs** — `id`, `tenant_id` FK, `nom`, `telephone`, `pin_hash`, `role` (`proprietaire` | `gerant` | `vendeur`), `magasins_autorises`, `actif`, `derniere_activite`

**parametres** — `id`, `tenant_id`, `magasin_id` (nullable), `cle`, `valeur_json`

### Catalogue

**categories** — `id`, `tenant_id`, `nom`, `parent_id` (nullable)

**articles** — `id`, `tenant_id`, `code_interne` (unique par tenant), `code_barres` (nullable), `designation`, `designation_alt` (synonymes locaux, pour la recherche), `categorie_id`, `unite_base` (pièce, mètre, kg, litre), `prix_achat_moyen`, `prix_vente_reference`, **`prix_plancher`**, `seuil_alerte_stock`, `emplacement`, `suivi_serie` (booléen), `actif`

**unites_vente** — `id`, `article_id`, `libelle` (carton, botte, sac, barre), `facteur_conversion` (ex. 12), `prix_vente`, `prix_plancher`

> Le champ `prix_plancher` est central. Dans une quincaillerie, on marchande. Le logiciel ne doit pas empêcher la négociation, il doit rendre visible toute vente sous le plancher.

### Stock

**mouvements_stock** — table **append-only**, aucun UPDATE, aucun DELETE
`id` (UUID client), `tenant_id`, `magasin_id`, `article_id`, `type`, `quantite_base` (signée), `cout_unitaire`, `document_type`, `document_id`, `motif`, `utilisateur_id`, `session_id`, `date_operation`, `date_enregistrement`, `device_id`

Types : `ENTREE_ACHAT`, `ENTREE_RETOUR_CLIENT`, `ENTREE_INVENTAIRE`, `SORTIE_VENTE`, `SORTIE_RETOUR_FOURNISSEUR`, `SORTIE_CASSE`, `SORTIE_PERTE`, `SORTIE_USAGE_INTERNE`, `AJUSTEMENT_INVENTAIRE`, `TRANSFERT_ENTREE`, `TRANSFERT_SORTIE`

**stock_actuel** — cache : `tenant_id`, `magasin_id`, `article_id`, `quantite`, `valeur`, `derniere_maj`. Toujours reconstructible par recalcul complet. Prévois une commande `recalculer-stock` dès le début.

### Ventes

**sessions_caisse** — `id`, `tenant_id`, `magasin_id`, `caisse_id`, `utilisateur_id`, `ouverte_le`, `fond_initial`, `fermee_le`, `especes_theoriques`, `especes_comptees`, `ecart`, `commentaire_ecart`, `statut`

**mouvements_caisse** — append-only : `id`, `session_id`, `sens` (`entree` | `sortie`), `montant`, `motif` (obligatoire), `beneficiaire`, `utilisateur_id`, `date`
Couvre les sorties d'espèces en cours de journée (paiement fournisseur, transport, avance) et les apports. Sans cette table, tout écart de clôture est ininterprétable.

**ouvertures_tiroir** — append-only : `id`, `session_id`, `utilisateur_id`, `vente_id` (nullable), `motif`, `date`
À implémenter seulement si un tiroir-caisse électronique est branché. Une ouverture sans vente associée est l'un des signaux de détournement d'espèces les plus classiques.

**ventes** — `id` (UUID client), `numero`, `tenant_id`, `magasin_id`, `session_id`, `utilisateur_id`, `client_id` (nullable), `date_vente`, `total_ht`, `montant_tva`, `total_ttc`, `remise_totale`, `marge_totale`, `statut` (`validee` | `annulee`), `annulee_par`, `annulee_le`, `motif_annulation`

> Une vente n'est **jamais** supprimée ni modifiée. On l'annule, ce qui génère les mouvements de stock inverses et laisse les deux traces.

**lignes_vente** — `id`, `vente_id`, `article_id`, `unite_vente_id`, `quantite`, `prix_unitaire_applique`, `prix_reference`, `prix_plancher_applique`, `remise_ligne`, `cout_unitaire_au_moment`, `marge_ligne`

**paiements** — `id`, `vente_id`, `mode` (`especes` | `orange_money` | `mtn_momo` | `virement` | `credit`), `montant`, `reference_transaction`, `encaisse_par`

> Plusieurs paiements par vente : un client peut payer 30 000 en espèces et 20 000 en MoMo.

### Clients et crédit

**clients** — `id`, `tenant_id`, `nom`, `telephone`, `type` (particulier, entreprise, maçon…), `plafond_credit`, `solde_actuel`, `actif`

**mouvements_compte_client** — append-only : `id`, `client_id`, `type` (`debit_vente` | `credit_reglement` | `avoir`), `montant`, `vente_id`, `mode_reglement`, `utilisateur_id`, `date`

### Achats

**fournisseurs** — `id`, `tenant_id`, `nom`, `telephone`, `conditions_paiement`, `solde`

**achats** — `id`, `tenant_id`, `magasin_id`, `fournisseur_id`, `numero_facture_fournisseur`, `date`, `total`, `statut` (`brouillon` | `receptionne`), `saisi_par`

**lignes_achat** — `id`, `achat_id`, `article_id`, `quantite`, `cout_unitaire`

### Contrôle

**inventaires** — `id`, `tenant_id`, `magasin_id`, `type` (`complet` | `tournant`), `date_debut`, `date_fin`, `statut`, `realise_par`, `valide_par`, `valeur_ecart_total`

**lignes_inventaire** — `id`, `inventaire_id`, `article_id`, `quantite_theorique`, `quantite_comptee`, `ecart`, `valeur_ecart`, `commentaire`

**journal_audit** — append-only : `id`, `tenant_id`, `utilisateur_id`, `session_id`, `action`, `entite_type`, `entite_id`, `donnees_avant` (JSON), `donnees_apres` (JSON), `device_id`, `horodatage`, `horodatage_serveur`

**alertes** — `id`, `tenant_id`, `magasin_id`, `type`, `severite`, `titre`, `details_json`, `entite_liee`, `lue_le`, `traitee_par`, `commentaire_traitement`

---

## 4. Dispositif anti-vol (dans la V1)

### Principes

1. **Rien ne s'efface.** Annulation avec motif obligatoire, jamais suppression.
2. **Tout est attribué.** Aucune opération sans utilisateur et session identifiés.
3. **Les écarts sont visibles, pas cachés.** L'objectif n'est pas d'empêcher, mais de rendre impossible le fait de passer inaperçu.
4. **La dissuasion prime sur la détection.** Les employés doivent savoir que le système trace. Dis-le explicitement au moment de la mise en service, et affiche le nom de l'opérateur en permanence sur l'écran de caisse et sur chaque ticket imprimé.

### Contrôles à implémenter

| Contrôle | Mécanisme |
|---|---|
| Écart de caisse | Comptage obligatoire à l'ouverture et à la fermeture du poste. Écart calculé, non modifiable, notifié au gérant si > seuil. |
| Vente sous le prix plancher | Autorisée mais tracée, avec motif. Alerte immédiate au-delà d'un pourcentage paramétrable. |
| Annulation de vente | Distinguer trois cas de gravité croissante : suppression d'une ligne avant encaissement, annulation du ticket avant encaissement, **annulation après encaissement**. Ce dernier cas est le signal le plus fort d'espèces détournées : motif obligatoire, alerte immédiate, et statistique mensuelle par opérateur. |
| Sortie d'espèces non justifiée | Toute sortie de caisse en cours de session exige un motif et un bénéficiaire. Total des sorties comparé à la moyenne habituelle. |
| Ouverture de tiroir sans vente | Si un tiroir électronique est branché, chaque ouverture non rattachée à une vente est enregistrée et comptabilisée par opérateur. |
| Comparaison entre opérateurs | Taux d'annulation, taux de remise et écart de caisse moyen **pour 100 tickets**, par personne. Un opérateur qui annule cinq fois plus que les autres se voit sans expertise particulière. C'est le contrôle le plus efficace et le plus simple à lire pour ton père. |
| Écarts systématiquement sous le seuil | Détection de motifs répétés : de petits manquants toujours juste en dessous du seuil d'alerte sont plus révélateurs qu'un gros écart isolé. Il faut donc une analyse par cumul glissant, pas seulement des règles par événement. |
| Ajustement de stock manuel | Réservé aux rôles `gerant`/`proprietaire`, motif obligatoire, alerte systématique. |
| Vente hors horaires | Créneaux d'ouverture paramétrés, toute vente en dehors est signalée. |
| Marge anormale par opérateur | Comparaison de la marge moyenne par vendeur sur période glissante. |
| Écarts d'inventaire répétés | Inventaire tournant : 15 à 20 articles recomptés chaque jour, en priorisant les articles à forte valeur ou forte rotation. Un article en écart récurrent remonte automatiquement. |
| Rupture non expliquée | Article dont le stock théorique tombe à zéro sans vente correspondante. |
| Trou de synchronisation | Numérotation séquentielle par appareil : un numéro manquant à la synchro signale une vente supprimée localement. |

### 4.3 Cloisonnement des accès

Le tableau de bord de suivi est réservé au propriétaire. Cette restriction doit être construite, pas seulement affichée.

**Application séparée.** Le tableau de bord n'est pas un écran caché à l'intérieur de l'application de caisse, c'est une application distincte avec son propre domaine et ses propres jetons d'authentification. Un employé sur la tablette du comptoir ne peut pas tomber dessus, même par accident, même en manipulant l'URL.

**Contrôle côté serveur, toujours.** L'API refuse toute route du tableau de bord à un jeton dont le rôle n'est pas `proprietaire`. Masquer un bouton dans l'interface ne protège rien : la vérification doit être dans le backend, et testée.

**Appareil de confiance.** À la première connexion, le téléphone est enregistré (`appareils_confiance` : `id`, `tenant_id`, `utilisateur_id`, `empreinte_appareil`, `nom`, `enregistre_le`, `dernier_acces`, `revoque_le`). Ensuite, un jeton longue durée évite de retaper un mot de passe à chaque ouverture, sinon l'application ne sera pas utilisée. Toute connexion depuis un nouvel appareil déclenche une alerte sur l'appareil déjà enregistré.

**Verrouillage à l'ouverture.** Empreinte digitale ou code PIN à chaque ouverture de l'application, parce qu'un téléphone se prête, se pose sur un comptoir et se vole.

**Révocation.** Le propriétaire peut révoquer un appareil depuis un autre appareil enregistré. Prévoir aussi une révocation côté serveur, pour le cas où il perd son téléphone et n'en a pas d'autre sous la main.

**Cloisonnement des données sensibles, y compris sur la caisse.** Un vendeur voit le prix de vente et le prix plancher. Il ne doit voir ni le prix d'achat, ni la marge, ni le chiffre d'affaires cumulé, ni l'écart de caisse d'un autre poste, ni la valorisation du stock. Ces champs sont filtrés **par l'API selon le rôle**, ils ne partent même pas vers l'appareil. C'est autant une protection contre le vol qu'une protection contre la fuite d'informations vers la concurrence.

**Traçabilité de la consultation.** Les accès au tableau de bord sont eux aussi journalisés. Si un jour quelqu'un consulte les chiffres depuis un appareil inattendu, la trace existe.

### Rapport quotidien automatique

Envoyé chaque soir sur le téléphone du gérant (notification + message) :
- chiffre d'affaires du jour, marge, nombre de tickets, panier moyen ;
- répartition par mode de paiement ;
- qui a tenu la caisse et sur quelles plages ;
- écart de caisse à la clôture ;
- liste des alertes du jour ;
- articles en rupture ou sous le seuil ;
- crédits accordés et encaissements de créances.

---

## 5. Modules fonctionnels

### Caisse (écran principal, optimisé pour la vitesse)
Recherche instantanée d'article (nom partiel, code, synonyme), ajout au ticket, choix de l'unité de vente, ajustement de prix avec contrôle du plancher, encaissement multi-mode, rendu de monnaie, impression du ticket, mise en attente d'un ticket pour servir un autre client.

Cible : **moins de 20 secondes** pour une vente de 3 articles. Si la caisse est plus lente que le carnet et la calculatrice, elle ne sera pas utilisée.

### Catalogue
Fiches articles, catégories, unités et conversions, prix et planchers, seuils d'alerte, import initial par fichier Excel/CSV, génération d'étiquettes.

### Stock
Consultation par article, historique complet des mouvements, entrées manuelles, casse et pertes, transferts entre magasins, alertes de seuil, valorisation.

### Achats et fournisseurs
Saisie des factures d'achat, réception avec mise à jour automatique du coût moyen pondéré, suivi des dettes fournisseurs.

### Clients et crédit
Fiches clients, plafond de crédit, vente à crédit, encaissement de créances, relevé de compte, liste des impayés par ancienneté.

### Facturation
Ticket thermique 80 mm pour la vente courante, facture A4 en PDF pour les clients professionnels, avec les mentions légales paramétrables (NIU, RCCM, régime fiscal, TVA).

### Tableau de bord mobile (gérant)
Consultation temps réel du CA du jour, ventes en cours, alertes, stock d'un article, historique par vendeur. Lecture seule, plus quelques actions de validation.

### Administration
Utilisateurs et rôles, paramètres du magasin, sauvegardes, journal d'audit consultable.

---

## 6. Stack technique

```
monorepo/
├── packages/
│   ├── domain/          # Logique métier pure, testée, sans I/O
│   ├── db/              # Schéma Drizzle + migrations
│   └── shared/          # Types, validations Zod, utilitaires
├── apps/
│   ├── api/             # Backend (Fastify ou NestJS)
│   ├── caisse/          # PWA React, offline-first
│   └── mobile/          # Tableau de bord gérant (PWA, puis Expo si besoin)
└── docs/                # Ce document + ADR
```

- **Langage** : TypeScript partout, mode `strict`.
- **Base serveur** : PostgreSQL + Drizzle ORM + RLS.
- **Base locale caisse** : SQLite via `wa-sqlite` / OPFS, ou `expo-sqlite` si tu passes en natif.
- **UI** : React + Vite + Tailwind. Écrans de caisse à grosses cibles tactiles, lisibles sous éclairage fort.
- **Impression** : ESC/POS pour le thermique (WebUSB, ou passerelle locale si tu passes par Electron), génération PDF pour l'A4.
- **Tests** : Vitest sur `domain` (couverture visée > 90 % sur le calcul de stock, la tarification et les règles d'alerte), Playwright sur les parcours de caisse critiques.
- **Hébergement** : un VPS chez un hébergeur avec latence correcte vers l'Afrique centrale, ou Supabase pour aller vite au début.

---

## 7. Plan de développement par lots

Chaque lot est une unité livrable, testable et démontrable à ton père. Ne passe pas au suivant tant que le précédent n'est pas utilisé pour de vrai.

| Lot | Contenu | Résultat visible |
|---|---|---|
| **0** | Monorepo, schéma de base, migrations, seed, authentification par PIN, rôles | Rien de visible, mais tout le reste en dépend |
| **1** | `domain` : mouvements de stock, calcul de quantité, coût moyen pondéré, tarification, TVA. Tests unitaires. | Suite de tests verte |
| **2** | Catalogue articles + import Excel du stock existant | Les articles de la boutique sont dans le système |
| **3** | Caisse hors ligne : ticket, encaissement, session de poste, clôture avec comptage | Une vraie vente peut être encaissée |
| **4** | Impression du ticket thermique | Le client repart avec son ticket |
| **5** | Journal d'audit, règles d'alerte, rapport quotidien | Le dispositif anti-vol est actif |
| **6** | Moteur de synchro + `LocalPeerTransport` (téléphone ↔ tablette) puis `HttpServerTransport`, tableau de bord mobile | Le gérant voit son activité sur son téléphone, avec ou sans internet |
| **7** | Achats et fournisseurs | Les entrées de stock sont propres |
| **8** | Clients et crédit | Fin du carnet d'ardoises papier |
| **9** | Inventaires tournants | Les écarts remontent tout seuls |
| **10** | Facture A4 PDF et mentions légales | Utilisable avec les clients professionnels |
| **11** | Durcissement multi-tenant, onboarding, sauvegardes, console admin | Prêt pour un deuxième client |

Les lots 0 à 6 constituent la V1. Compte réaliste : c'est le gros du travail.

---

## 8. Matériel

| Élément | Recommandation | Remarque |
|---|---|---|
| Poste de caisse | Tablette Android 10" ou mini-PC + écran | La tablette survit mieux aux coupures grâce à sa batterie |
| Imprimante | Thermique 80 mm, USB ou Bluetooth (Xprinter, Epson TM-T20) | Achète les rouleaux en gros, c'est le consommable |
| Connectivité | **Carte SIM directement dans la tablette de caisse** | Solution recommandée. Voir ci-dessous |
| Onduleur | Petit onduleur ou simplement la batterie de la tablette | Évite les redémarrages en pleine vente |
| Sauvegarde | Export automatique quotidien chiffré vers le cloud + copie sur clé USB | Le vol de la tablette ne doit pas être un vol de l'entreprise |

**Sur la connectivité** : le point souvent mal compris est que la contrainte se situe côté caisse. Le téléphone du gérant peut être connecté en permanence, s'il n'y a rien qui émet depuis la boutique, il n'y a rien à afficher.

Trois configurations possibles, par ordre de préférence :

1. **Carte SIM dans la tablette de caisse** — recommandé. Aucun équipement supplémentaire, aucun point de panne en plus, aucun wifi à installer. L'application ne transmet que du texte (une vente pèse quelques centaines d'octets), donc le plus petit forfait data disponible suffit largement. Le suivi temps réel fonctionne, y compris quand le gérant est loin de la boutique.
2. **Routeur 4G dédié** — équivalent en résultat, mais c'est un boîtier de plus à alimenter, à surveiller et qui peut tomber en panne. À retenir seulement si tu veux connecter plusieurs appareils plus tard.
3. **Partage de connexion depuis un téléphone présent dans la boutique** — solution de repli sans coût. La synchro se fait par rafales, le rapport quotidien et l'audit restent complets, mais le suivi temps réel ne fonctionne plus quand le gérant s'absente, c'est-à-dire précisément quand il en aurait le plus besoin.

Dans tous les cas, l'application doit continuer à encaisser normalement sans aucun réseau. La connectivité améliore le suivi, elle ne conditionne jamais la vente.

---

## 9. Travailler avec Claude Code

Crée un fichier `CLAUDE.md` à la racine du dépôt avec au minimum ces règles :

```markdown
# Règles du projet

## Invariants non négociables
- `mouvements_stock` et `journal_audit` sont append-only. Aucun UPDATE, aucun DELETE.
  Jamais. Si une correction est nécessaire, on insère un mouvement inverse.
- Aucun champ `quantite` mutable sur `articles`. La quantité est calculée.
- Toute requête sur une table métier filtre par `tenant_id`.
- Toute opération de caisse est rattachée à une `session_caisse` ouverte.
- Les identifiants sont des UUID v7 générés côté client, jamais des auto-incréments.
- Aucune valeur métier en dur : TVA, devise, arrondis, mentions légales viennent de `parametres`.
- Aucune fonctionnalité métier ne dépend du réseau. L'UI de caisse lit toujours la base
  locale, jamais l'API directement. Toute mutation écrit sa donnée et son événement
  `outbox` dans la même transaction.
- Le calcul des alertes s'exécute dans `domain`, côté caisse. Une notification est un
  canal de livraison, jamais la source d'une alerte.

## Architecture
- `packages/domain` ne dépend d'aucune base de données, d'aucun framework UI,
  d'aucun accès réseau. Fonctions pures uniquement.
- Toute nouvelle règle métier s'écrit d'abord dans `domain`, avec ses tests, avant l'UI.

## Conventions
- TypeScript strict, pas de `any`.
- Validation des entrées avec Zod aux frontières.
- Messages d'interface en français.
- Montants en entiers (centimes/francs), jamais en flottants.
- Commits conventionnels, une fonctionnalité par branche.

## Avant de proposer du code
- Ne modifie jamais le schéma de base sans le signaler explicitement.
- Si une demande entre en conflit avec un invariant ci-dessus, signale-le au lieu de contourner.
```

Méthode de travail conseillée :
- Un lot du §7 = une session de travail cadrée. Donne à Claude Code le contexte du lot, pas tout le document.
- Fais écrire les tests du domaine **avant** l'implémentation. C'est là que les bugs coûtent cher.
- Relis toi-même chaque migration de base de données. C'est le seul endroit où une erreur est difficilement réversible.
- Garde un dossier `docs/adr/` où tu notes chaque décision d'architecture et sa raison. Dans six mois tu auras oublié pourquoi tu as tranché ainsi.

---

## 10. Points à vérifier avant de coder la facturation

- **Obligations DGI** : les règles de facturation normalisée au Cameroun ont évolué. Renseigne-toi sur ce qui s'applique à une entreprise de la taille de celle de ton père (régime fiscal, mentions obligatoires, éventuelle transmission électronique, format de numérotation). Cela peut contraindre le format de la facture et la numérotation.
- **Taux et régime de TVA** applicables à l'activité, et articles éventuellement exonérés.
- **Conservation des données** : durée légale d'archivage des pièces commerciales.
- **Mobile money** : au début, saisie manuelle du mode de paiement et de la référence. L'intégration API aux opérateurs est un chantier séparé, à n'envisager que si le volume le justifie.

---

## 11. Ce qui rendra le produit revendable

Note-le dès maintenant, ce sont les points sur lesquels un logiciel maison échoue habituellement à devenir un produit :

- **Installation en moins d'une heure** chez un nouveau client, import du catalogue compris.
- **Aucune donnée en dur** : le mot « quincaillerie » ne doit apparaître nulle part dans le code.
- **Migrations de base versionnées** et réversibles.
- **Sauvegarde et restauration testées**, pas seulement écrites.
- **Journalisation côté serveur** pour diagnostiquer à distance sans déplacement.
- **Un mode démonstration** avec des données fictives, pour vendre sans exposer les données d'un client.
- **Documentation utilisateur courte**, en français, avec captures d'écran.

---

## 12. Revue de l'existant open source

Cette revue a servi à valider et corriger le plan. Résumé de ce qui a été retenu et de ce qui a été écarté.

### Ce qui confirme les choix

| Projet | Ce qu'il valide |
|---|---|
| **ERPNext** (Python/Frappe, GPL) | Le grand livre immuable, avec annulation par écriture inverse plutôt que par suppression. Ils ont fait ce basculement en v13 après avoir mesuré le coût de l'approche mutable. |
| **InvenTree** (Python/Django, MIT) | Le suivi systématique de l'historique des mouvements de stock en arrière-plan, avec une saisie qui reste en un geste pour l'utilisateur. Bon modèle d'équilibre entre traçabilité forte et ergonomie légère. |
| **Odoo POS** (Python, LGPL pour la version communautaire) | Le modèle de session de caisse avec balance d'ouverture, balance de clôture, écart calculé, seuil d'écart autorisé et validation par un responsable au-delà. Notre conception en est proche, ce qui est rassurant. |
| **Pratiques de prévention des pertes (EBR)** | L'ensemble des règles du §4. Le terme du métier est *Exception-Based Reporting* : on n'examine pas toutes les transactions, on ne remonte que les anomalies. C'est exactement l'architecture d'alertes retenue. |

### Ce que la revue a corrigé dans ce document

1. **Coût moyen pondéré au lieu du FIFO**, pour ne pas hériter du problème de recalcul en cascade qu'ERPNext a dû résoudre en interdisant les écritures antidatées.
2. **Comptage de caisse à l'aveugle**, l'opérateur saisit avant de voir le théorique.
3. **Table `mouvements_caisse`** pour les entrées et sorties d'espèces en cours de journée, absente de la première version et sans laquelle aucun écart n'est interprétable.
4. **Distinction des trois types d'annulation**, l'annulation après encaissement étant le signal le plus grave.
5. **Ouvertures de tiroir sans vente**, si un tiroir électronique est utilisé.
6. **Comparaison entre opérateurs ramenée à 100 tickets**, plus lisible qu'un compte brut.
7. **Détection des écarts répétés sous le seuil**, en plus des alertes par événement.
8. **Clôture de session indépendante du réseau**, pour ne pas reproduire le blocage observé sur Odoo POS quand la synchronisation échoue.

### Ce qui a été écarté, et pourquoi

**Partir d'ERPNext ou d'Odoo plutôt que de construire.** C'est l'option raisonnable si l'objectif était seulement d'équiper la boutique. Elle est écartée pour trois raisons : ces systèmes ne sont pas conçus pour fonctionner des jours entiers sans réseau ; leur empreinte technique est disproportionnée pour une tablette de comptoir ; et les revendre suppose de maîtriser un socle que tu ne contrôles pas. Cela dit, garde-les comme référence de conception, leurs schémas de données valent la lecture.

**Les moteurs de synchronisation clés en main** (PowerSync, ElectricSQL, Zero, RxDB). Ils sont matures et méritaient l'examen, mais aucun ne résout notre cas :

- Le transport de proximité tablette ↔ téléphone sans serveur n'est supporté par aucun d'eux.
- Le support véritablement hors ligne est inégal selon les projets, certains ayant explicitement mis le sujet hors périmètre.
- Ce sont des dépendances structurantes qui deviennent un poste de coût opérationnel proportionnel au volume, ce qui contredit l'objectif de vendre à des boutiques sans abonnement.
- PowerSync est publié sous licence FSL, source-available, qui bascule en Apache 2.0 après deux ans. Un logiciel de caisse n'est pas un produit concurrent, donc l'usage est *a priori* permis, mais c'est une clause à relire avant de bâtir un produit commercial dessus.

Notre volume est minuscule (quelques centaines d'événements par jour, un seul écrivain par magasin), et le pattern outbox du §2.6 tient en quelques centaines de lignes. La dépendance ne se justifie pas.

**Les CRDT.** Inutiles ici. Avec un seul écrivain par magasin sur un journal append-only, il n'y a structurellement pas de conflit à résoudre.

### À relire quand tu attaqueras un module

- ERPNext, la documentation du grand livre immuable et le modèle du `Stock Ledger Entry`.
- InvenTree, le modèle `StockItem` et `StockItemTracking`.
- Odoo POS, l'écran de clôture de session et le traitement de l'écart.


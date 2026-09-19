# Unités de travail — TenuXpector V1

Entrées : `aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/inception/domain-design/components.md`, `.../domain-design/decisions.md`, `.../requirements-analysis/requirements.md`.

Cette page décrit **ce que contient chaque unité** et **ce dont elle dépend**. Elle ne choisit pas l'ordre de construction : c'est le sujet de l'étape suivante.

## Table des unités

| Unité | Nom | Dossier | Nature | Taille | Modèle de livraison |
|---|---|---|---|---|---|
| U1 | Preuve de concept PC | `u1-pc-proof` | packaging | M | Autonome, jetable dans sa forme mais conservé comme base |
| U2 | Socle | `u2-foundation` | library | L | Partagé par toutes les unités |
| U3 | Domaine | `u3-domain` | library | XL | Partagé, sans exécutable propre |
| U4 | Catalogue et saisie | `u4-catalog` | ui | L | Embarqué dans la caisse |
| U5 | Caisse hors ligne | `u5-register` | ui | XL | Embarqué dans la caisse |
| U6 | Impression | `u6-printing` | library | M | Embarqué dans la caisse |
| U7 | Audit, alertes et rapport | `u7-audit-alerts` | library | L | Embarqué dans la caisse |
| U8 | Synchronisation et serveur | `u8-sync` | service | XL | Serveur autonome plus client embarqué |
| U9 | Approvisionnement | `u9-procurement` | ui | M | Embarqué dans la caisse |
| U10 | Crédit client | `u10-credit` | ui | M | Embarqué dans la caisse |
| U11 | Facturation | `u11-invoicing` | ui | M | Embarqué dans la caisse |
| U12 | Empaquetage PC | `u12-desktop-packaging` | packaging | M | Installateur Windows autonome |
| U13 | Empaquetage tablette | `u13-android-packaging` | packaging | M | Application Android autonome |
| U14 | Application du propriétaire | `u14-owner-app` | ui | L | Application installée, séparée de la caisse |

> Les identifiants U1 à U14 sont ceux des **unités de travail** de ce plan. Ils ne se confondent pas avec les unités U0 à U10 du document d'exigences, qui désignent des lots fonctionnels. La correspondance est donnée pour chaque unité ci-dessous.

## Détail par unité

### U1 — Preuve de concept PC (`u1-pc-proof`)

**Ce qu'elle prouve.** Que les trois risques techniques identifiés à la faisabilité se lèvent sur un vrai PC : une base locale chiffrée qui s'ouvre et se referme, un ticket qui sort sur l'imprimante thermique USB, et la survie à une coupure de courant en pleine écriture.

**Contenu.** Une application Electron minimale, durcie dès le départ — isolation de contexte, pas d'intégration Node dans l'interface, pont validé. Un module de base chiffrée. Un adaptateur d'impression. Un scénario d'arrêts forcés.

**Frontière.** Aucune règle métier. Aucune vente réelle. Si une règle apparaît ici, elle est au mauvais endroit.

**Notes.** Son code est **conservé** et sert de base au socle. Il respecte donc dès maintenant les pratiques de code, de test et de sécurité du projet.

**Dépend de.** Rien.

### U2 — Socle (`u2-foundation`)

**Contenu.** Le monorepo et ses paquets, le schéma et ses migrations réversibles, le jeu de données de démonstration, l'authentification par PIN et les rôles, la lecture typée des paramètres, l'écriture transactionnelle et le journal d'audit.

**Composants construits.** Identity, Settings, TransactionalWriter, SensitiveDataGuard.

**Frontière.** Pas de règle de calcul métier — elles sont dans le domaine. Pas d'écran de vente.

**Correspondance document.** Unité U0.

**Dépend de.** U1.

### U3 — Domaine (`u3-domain`)

**Contenu.** Toutes les fonctions pures : quantités et mouvements de stock, coût moyen pondéré, conversion d'unités, tarification et plancher, totaux et marges, paiements et rendu, espèces théoriques et écart, moteur d'alertes, rapport.

**Composants construits.** StockLedger, Costing, Pricing, SaleCalculator, CashSession, AlertEngine, Reporting.

**Frontière.** Aucune dépendance à une base, à une interface ou au réseau. Tests d'abord, couverture d'au moins 90 % des lignes et des branches.

**Correspondance document.** Unité U1.

**Dépend de.** U2.

### U4 — Catalogue et saisie (`u4-catalog`)

**Contenu.** Fiche article, unités de vente, recherche insensible aux accents, saisie clavier rapide à grand volume, import de fichier, et saisie par photo du registre avec écran de vérification.

**Composants construits.** Catalog, CatalogCapture.

**Frontière.** L'import crée les articles et leurs prix, **jamais de quantité**. Le moyen de reconnaissance de texte reste à choisir : l'unité l'isole derrière une interface.

**Correspondance document.** Unité U2.

**Dépend de.** U3.

### U5 — Caisse hors ligne (`u5-register`)

**Contenu.** L'écran de caisse et son parcours complet : ouverture de session avec comptage à l'aveugle, ajout d'articles, modification de prix avec motif, paniers en attente, encaissement multi-modes, annulation, entrées et sorties d'espèces, clôture dans l'ordre imposé.

**Frontière.** L'unité consomme le domaine, elle ne recalcule rien. Elle lit la base locale, jamais l'API.

**Correspondance document.** Unité U3.

**Dépend de.** U4.

### U6 — Impression (`u6-printing`)

**Contenu.** Composition du ticket de vente et du ticket de clôture, adaptateur ESC/POS sur USB, aperçu à l'écran, file d'impression relançable, duplicata tracé, pilotage conditionnel du tiroir-caisse.

**Composants construits.** Receipt, en totalité pour ce qui est du rendu : l'interface de composition, la file, l'adaptateur et les entités `PrintJob`. U6 est le **seul propriétaire** du code d'impression.

**Frontière.** Une impression échouée ne bloque jamais une vente. U6 pose une interface de document imprimable ; il n'a pas à connaître la facture.

**Correspondance document.** Unité U4.

**Dépend de.** U5.

### U7 — Audit, alertes et rapport (`u7-audit-alerts`)

**Contenu.** Branchement du moteur d'alertes sur les événements réels, écran des alertes réservé aux rôles supérieurs, traitement d'une alerte, règles glissantes évaluées à la clôture et au démarrage, rapport journalier, comparaison des opérateurs.

**Frontière.** Les règles elles-mêmes vivent dans le domaine ; cette unité les branche et les affiche.

**Correspondance document.** Unité U5.

**Dépend de.** U5.

### U8 — Synchronisation et serveur (`u8-sync`)

**Contenu.** Le moteur de vidage de la file d'événements, l'interface de transport et ses implémentations, les curseurs, le serveur PostgreSQL avec isolation par tenant, l'idempotence, la détection des trous de numérotation, les appareils de confiance.

**Composants construits.** SyncEngine.

**Frontière.** Aucune fonctionnalité métier n'en dépend. Sans transport configuré, la file s'accumule sans rien casser.

**Correspondance document.** Unité U6.

**Dépend de.** U7.

### U9 — Approvisionnement (`u9-procurement`)

**Contenu.** Fiche fournisseur, saisie d'une réception directe avec coût unitaire réel, réception inverse pour correction, écrans réservés aux rôles supérieurs.

**Composants construits.** Procurement.

**Frontière.** Pas de commande préalable, pas de dette fournisseur.

**Correspondance document.** Unité U7.

**Dépend de.** U4.

### U10 — Crédit client (`u10-credit`)

**Contenu.** Fiche client réduite au nom et au téléphone, plafond, paiement à crédit à la caisse, refus au-delà du plafond avec dérogation par PIN du propriétaire, remboursements partiels, solde calculé, relevé imprimable.

**Composants construits.** Credit.

**Frontière.** Le compte client est un journal à ajout seul ; le solde n'est jamais stocké de façon mutable.

**Correspondance document.** Unité U8.

**Dépend de.** U5.

### U11 — Facturation (`u11-invoicing`)

**Contenu.** Numérotation propre aux factures, continue et sans trou ; composition de la facture avec ses mentions obligatoires ; sortie au choix sur ticket thermique ou en PDF A4 ; duplicata tracé.

**Composants construits.** L'entité `Invoice` et la composition de la facture, écrites **comme un nouveau document derrière l'interface posée par U6**. U11 ne modifie aucun fichier de U6 et ne duplique aucune composition de ticket : il fournit une implémentation de plus à une interface déjà livrée.

**Frontière.** Régime de l'impôt général synthétique, donc mention « TVA non applicable ». Les mentions restent une hypothèse à faire valider. L'acheteur d'une facture est désigné ici, par sa raison sociale et son NIU ; ce n'est pas le client à crédit de U10.

**Correspondance document.** Unité U10.

**Dépend de.** U6.

### U12 — Empaquetage PC (`u12-desktop-packaging`)

**Contenu.** L'installateur Windows d'Electron, la configuration de durcissement, la compilation du module natif de base chiffrée pour la version d'Electron retenue, la procédure d'installation.

**Frontière.** Aucune règle métier. Aucun écran.

**Dépend de.** U6.

### U13 — Empaquetage tablette (`u13-android-packaging`)

**Contenu.** L'empaquetage Capacitor pour Android, les adaptateurs natifs de la tablette — base chiffrée, impression, alimentation — et la preuve de concept propre à cette cible.

**Frontière.** Le code métier et l'interface sont ceux des autres unités : seuls les adaptateurs diffèrent. La parité du parcours complet entre les deux cibles est vérifiée ici.

**Dépend de.** U12.

### U14 — Application du propriétaire (`u14-owner-app`)

**Contenu.** L'application installée sur le téléphone du propriétaire : écrans du jour, alertes, stock d'un article, sessions et écarts, comparaison des opérateurs, rapport journalier, fraîcheur des données, appareil de confiance et verrouillage biométrique.

**Frontière.** Séparée de la caisse. Son contrôle d'accès est vérifié **dans l'API**, et testé. Sa plateforme reste à décider.

**Correspondance document.** Unité U6, partie tableau de bord.

**Dépend de.** U8.

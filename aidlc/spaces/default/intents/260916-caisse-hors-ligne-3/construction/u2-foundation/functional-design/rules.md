# Règles métier — U2 Socle (`u2-foundation`)

> Résumé consolidé confirmé (`Looks correct`).

```yaml
rules:
  - id: BR1.1
    statement: Toute table métier porte tenantId, createdAt, createdBy et deviceId ; chaque requête métier filtre par tenantId
    category: constraint
    applies_to: [Tenant, Store, User, Setting, Category, Product, SellingUnit, AuditEntry, OutboxEvent]
    trigger: lecture ou écriture métier
    logic: IF une opération touche une entité métier THEN elle inclut et filtre tenantId AND les métadonnées de création sont renseignées à l'insert
    violation: refus de l'opération
    source: FR1.2

  - id: BR1.2
    statement: Les migrations de schéma sont versionnées et chaque migration a un chemin inverse
    category: policy
    applies_to: [schema]
    trigger: changement de schéma
    logic: IF une migration est appliquée THEN son inverse doit pouvoir restaurer l'état précédent
    violation: migration refusée / non fusionnable
    source: FR1.2

  - id: BR1.3
    statement: AuditEntry et PinAttempt sont append-only ; aucune modification ni suppression après création ; une correction = nouvelle entrée
    category: constraint
    applies_to: [AuditEntry, PinAttempt]
    trigger: tentative de mise à jour ou suppression
    logic: IF UPDATE ou DELETE sur AuditEntry ou PinAttempt THEN rejeter
    violation: rejet par la couche de persistance
    source: FR1.3, FR6.1

  - id: BR1.4
    statement: Les identifiants d'entités créées sur l'appareil sont des UUID v7 générés côté client
    category: constraint
    applies_to: [all_entities]
    trigger: création d'entité
    logic: IF une entité est créée localement THEN son id est un UUID v7 client, jamais un auto-incrément
    violation: refus de persistance
    source: FR1.5

  - id: BR1.5
    statement: Isolation tenant — aucune lecture/écriture métier sans tenant courant conforme
    category: authorization
    applies_to: [all_entities]
    trigger: toute opération
    logic: IF tenantId de la donnée ≠ tenant du contexte THEN refuser
    violation: refus
    source: FR1.4

  - id: BR2.1
    statement: PIN de 4 à 6 chiffres, stocké uniquement sous forme dérivée PBKDF2-SHA256 (≥ 310 000 itérations, sel par utilisateur), vérifié sans réseau
    category: authorization
    applies_to: [User]
    trigger: authentification caisse
    logic: IF vérification PIN THEN dériver localement avec sel et itérations de l'utilisateur et comparer au hash ; never transmit PIN
    violation: échec d'authentification
    source: FR1.6

  - id: BR2.2
    statement: Après 5 échecs PIN en 10 minutes pour un utilisateur, les nouvelles tentatives sont refusées jusqu'à expiration de la fenêtre
    category: authorization
    applies_to: [User, PinAttempt]
    trigger: tentative PIN
    logic: IF count(PinAttempt success=false dans les 10 dernières minutes) ≥ 5 THEN bloquer
    violation: authentification refusée (compte temporairement bloqué)
    source: FR1.6

  - id: BR2.3
    statement: Chaque tentative PIN (succès ou échec) crée une PinAttempt ; jamais d'écrasement
    category: policy
    applies_to: [PinAttempt]
    trigger: tentative PIN
    logic: IF une vérification PIN est tentée THEN append PinAttempt
    violation: tentative non tracée = défaut bloquant
    source: FR1.6, FR6.1

  - id: BR2.4
    statement: Le rôle gerant est unique (0 ou 1), assignable et révocable hors ligne par le propriétaire ; chaque changement écrit AuditEntry
    category: authorization
    applies_to: [User, AuditEntry]
    trigger: assignation ou révocation gerant
    logic: IF propriétaire assigne gerant à U THEN révoquer tout autre gerant actif du tenant AND écrire AuditEntry ROLE_ASSIGNE ; IF révocation THEN AuditEntry ROLE_REVOQUE
    violation: refus si auteur ≠ proprietaire ; état incohérent interdit
    source: FR1.9

  - id: BR3.1
    statement: Toute valeur métier (TVA, devise, arrondis, seuils, mentions, modes de paiement) est lue via Setting validé à la frontière ; jamais en dur dans le code métier
    category: validation
    applies_to: [Setting]
    trigger: lecture de paramètre
    logic: IF un paramètre est requis THEN le lire, valider sa forme typée, sinon appliquer le défaut documenté
    violation: erreur de configuration explicite (pas de valeur inventée)
    source: FR1.8

  - id: BR3.2
    statement: Une surcharge Setting par magasin prime sur la valeur tenant ; absente → défaut documenté
    category: policy
    applies_to: [Setting]
    trigger: résolution d'une clé
    logic: IF Setting(storeId) existe THEN l'utiliser ELSE IF Setting(tenant) ELSE défaut
    violation: N/A (toujours une valeur résolue ou erreur typée)
    source: FR1.8

  - id: BR4.1
    statement: Toute mutation métier est écrite dans une seule transaction atomique avec sa ou ses AuditEntry et OutboxEvent
    category: constraint
    applies_to: [TransactionalWriter, AuditEntry, OutboxEvent]
    trigger: mutation métier
    logic: IF mutation THEN dans la même transaction écrire donnée + audit + outbox ; IF échec partiel THEN rien n'est visible
    violation: rollback total
    source: FR4.8, FR6.1, FR7.1

  - id: BR4.2
    statement: Aucune mutation métier ne peut omettre OutboxEvent ; un test vérifie qu'une mutation sans outbox échoue
    category: constraint
    applies_to: [OutboxEvent]
    trigger: commit de mutation
    logic: IF mutation commitée THEN ≥ 1 OutboxEvent lié dans la même transaction
    violation: commit refusé / test rouge
    source: FR7.1

  - id: BR4.3
    statement: OutboxEvent.localSequence est strictement croissante par tenant
    category: constraint
    applies_to: [OutboxEvent]
    trigger: création d'événement
    logic: IF nouvel OutboxEvent THEN localSequence = max(tenant)+1
    violation: refus
    source: FR7.1

  - id: BR5.1
    statement: SensitiveDataGuard retire prix d'achat, CUMP, marge, CA cumulé et valorisation pour le rôle vendeur
    category: authorization
    applies_to: [Product, SensitiveDataGuard]
    trigger: lecture sortante vers UI ou API
    logic: IF role=vendeur THEN retirer champs sensibles de toute projection
    violation: fuite = défaut bloquant
    source: FR1.3 (DEC-01), §2.2

  - id: BR5.2
    statement: Product n'expose aucune quantité mutable ; pas de champ stock sur Product
    category: constraint
    applies_to: [Product]
    trigger: modèle / écriture catalogue
    logic: IF Product est créé ou mis à jour THEN aucun attribut quantité stock
    violation: schéma / validation refuse
    source: FR3.4, Q1-B

  - id: BR5.3
    statement: floorPrice ≤ referencePrice (Product) et floorPrice ≤ price (SellingUnit) ; au moins une SellingUnit de base (conversionFactor = 1000)
    category: validation
    applies_to: [Product, SellingUnit]
    trigger: création ou mise à jour fiche
    logic: IF contrainte prix ou unité de base violée THEN refuser
    violation: validation échoue
    source: FR3.1 (schéma anticipé)

  - id: BR5.4
    statement: Un Product n'est jamais supprimé ; désactivation via active=false
    category: policy
    applies_to: [Product]
    trigger: retrait catalogue
    logic: IF retrait THEN active=false AND AuditEntry ; never physical delete
    violation: delete refusé
    source: FR3.8 (schéma anticipé)

  - id: BR6.1
    statement: Le jeu de démonstration crée un tenant fictif, 3 utilisateurs et 200 articles avec unités/prix, sans mouvements de stock ni ventes
    category: policy
    applies_to: [Tenant, User, Product, SellingUnit, Setting]
    trigger: commande seed
    logic: IF seed exécuté THEN peupler identité + paramètres + catalogue ; ventes historiques différées (pas de tables vente dans cette unité)
    violation: seed incomplet pour le périmètre déclaré
    source: FR1.7

  - id: BR6.2
    statement: Le mot interdit du domaine commercial n'apparaît dans aucun artefact de code ; uniquement éventuellement dans des données de seed désignées
    category: policy
    applies_to: [code]
    trigger: revue / contrôle automatisé
    logic: IF fichier code (hors chemin seed exact) contient le mot THEN échec
    violation: contrôle rouge
    source: FR1.7, ENF-14
```

## Synthèse

| ID | Catégorie | En une ligne |
|---|---|---|
| BR1.1–BR1.5 | Socle schéma | Tenant, migrations réversibles, UUID v7, append-only audit/PIN, isolation |
| BR2.1–BR2.4 | Identité | PIN PBKDF2 local, blocage, traçage, gerant tournant |
| BR3.1–BR3.2 | Paramètres | Lecture typée, défauts, surcharge magasin |
| BR4.1–BR4.3 | Écriture | Atomicité donnée + audit + outbox, séquence |
| BR5.1–BR5.4 | Catalogue + masquage | Pas de qty, contraintes prix, désactivation, filtre vendeur |
| BR6.1–BR6.2 | Seed / hygiene | Démo sans ventes, mot interdit hors seed |

# Entités — U2 Socle (`u2-foundation`)

> Résumé consolidé confirmé (`Looks correct`).

Décisions Q&A : schéma identité + paramètres + audit + outbox **et** catalogue sans quantités (Q1-B) ; PIN PBKDF2 local (Q2-A) ; paramètres typés validés à la lecture (Q3-A) ; outbox dans la même transaction (Q4-A) ; audit append-only (Q5-A).

Hors périmètre de persistance ici : sessions de caisse, ventes, mouvements de stock/caisse, paniers. La logique d’import/recherche catalogue reste U4 ; ce modèle ne pose que la **forme** des articles.

```yaml
entities:
  - name: Tenant
    description: Organisation propriétaire des données isolées
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: name, logical_type: text, required: true }
      - { name: createdAt, logical_type: instant, required: true }
    constraints:
      - Tout enregistrement métier porte ce tenant
    relationships: []

  - name: Store
    description: Magasin appartenant à un tenant
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: name, logical_type: text, required: true }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    relationships:
      - { to: Tenant, cardinality: many_to_one, direction: Store->Tenant }

  - name: User
    description: Opérateur de caisse ou propriétaire ; PIN jamais en clair
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: name, logical_type: text, required: true }
      - { name: phone, logical_type: text, required: false }
      - { name: pinHash, logical_type: opaque_hash, required: true }
      - { name: pinSalt, logical_type: opaque_bytes, required: true }
      - { name: pinIterations, logical_type: integer, required: true, min: 310000 }
      - { name: role, logical_type: enum, required: true, allowed: [vendeur, gerant, proprietaire] }
      - { name: allowedStoreIds, logical_type: uuid_v7_list, required: true }
      - { name: active, logical_type: boolean, required: true, default: true }
      - { name: lastActivityAt, logical_type: instant, required: false }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    constraints:
      - Au plus un User actif avec role=gerant par tenant à un instant donné
      - pinHash dérivé par PBKDF2-SHA256 ; pinIterations ≥ 310000
    relationships:
      - { to: Tenant, cardinality: many_to_one, direction: User->Tenant }
      - { to: PinAttempt, cardinality: one_to_many, direction: User->PinAttempt }

  - name: PinAttempt
    description: Tentative de vérification PIN, à ajout seul
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: userId, logical_type: uuid_v7, required: true, references: User.id }
      - { name: registerId, logical_type: uuid_v7, required: false }
      - { name: attemptedAt, logical_type: instant, required: true }
      - { name: success, logical_type: boolean, required: true }
      - { name: deviceId, logical_type: text, required: true }
    constraints:
      - Aucune mise à jour ni suppression après création
    relationships:
      - { to: User, cardinality: many_to_one, direction: PinAttempt->User }

  - name: Setting
    description: Paramètre métier typé ; surcharge possible par magasin
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: storeId, logical_type: uuid_v7, required: false, references: Store.id }
      - { name: key, logical_type: text, required: true }
      - { name: value, logical_type: structured_value, required: true }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    constraints:
      - Unicité (tenantId, storeId nullable, key)
      - Valeur absente → défaut documenté appliqué à la lecture, jamais en dur dans une règle métier
    relationships:
      - { to: Tenant, cardinality: many_to_one, direction: Setting->Tenant }
      - { to: Store, cardinality: many_to_one, direction: Setting->Store, optional: true }

  - name: Category
    description: Catégorie d'article, hiérarchie optionnelle
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: name, logical_type: text, required: true }
      - { name: parentId, logical_type: uuid_v7, required: false, references: Category.id }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    relationships:
      - { to: Category, cardinality: many_to_one, direction: Category->Category, optional: true }

  - name: Product
    description: Article du catalogue ; jamais de quantité stockée sur l'entité
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: internalCode, logical_type: text, required: true, unique_per: tenantId }
      - { name: barcode, logical_type: text, required: false }
      - { name: name, logical_type: text, required: true }
      - { name: altNames, logical_type: text_list, required: false }
      - { name: categoryId, logical_type: uuid_v7, required: false, references: Category.id }
      - { name: baseUnit, logical_type: text, required: true }
      - { name: averagePurchaseCost, logical_type: integer_milli_fcfa, required: false }
      - { name: referencePrice, logical_type: integer_fcfa, required: true, min: 0 }
      - { name: floorPrice, logical_type: integer_fcfa, required: true, min: 0 }
      - { name: stockAlertThreshold, logical_type: integer_milli_base, required: false }
      - { name: location, logical_type: text, required: false }
      - { name: active, logical_type: boolean, required: true, default: true }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    constraints:
      - floorPrice ≤ referencePrice
      - Aucun attribut de quantité en stock ; la quantité est calculée ailleurs (RG-10)
      - Désactivation via active=false ; jamais de suppression physique métier
    relationships:
      - { to: Category, cardinality: many_to_one, direction: Product->Category, optional: true }
      - { to: SellingUnit, cardinality: one_to_many, direction: Product->SellingUnit }

  - name: SellingUnit
    description: Unité de vente d'un article (base facteur 1 obligatoire)
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: productId, logical_type: uuid_v7, required: true, references: Product.id }
      - { name: label, logical_type: text, required: true }
      - { name: conversionFactor, logical_type: integer_milli_base, required: true, min: 1 }
      - { name: price, logical_type: integer_fcfa, required: true, min: 0 }
      - { name: floorPrice, logical_type: integer_fcfa, required: true, min: 0 }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: createdBy, logical_type: uuid_v7, required: true }
      - { name: deviceId, logical_type: text, required: true }
    constraints:
      - floorPrice ≤ price
      - Au moins une SellingUnit par Product avec conversionFactor = 1000 (unité de base)
    relationships:
      - { to: Product, cardinality: many_to_one, direction: SellingUnit->Product }

  - name: AuditEntry
    description: Entrée du journal d'audit ; append-only strict
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: userId, logical_type: uuid_v7, required: true, references: User.id }
      - { name: sessionId, logical_type: uuid_v7, required: false }
      - { name: action, logical_type: text, required: true }
      - { name: entityKind, logical_type: text, required: true }
      - { name: entityId, logical_type: uuid_v7, required: true }
      - { name: before, logical_type: structured_value, required: false }
      - { name: after, logical_type: structured_value, required: false }
      - { name: deviceId, logical_type: text, required: true }
      - { name: recordedAt, logical_type: instant, required: true }
    constraints:
      - Aucune mise à jour ni suppression ; correction = nouvelle entrée
    relationships:
      - { to: User, cardinality: many_to_one, direction: AuditEntry->User }

  - name: OutboxEvent
    description: Événement de synchronisation écrit avec la mutation
    attributes:
      - { name: id, logical_type: uuid_v7, required: true, unique: true }
      - { name: tenantId, logical_type: uuid_v7, required: true, references: Tenant.id }
      - { name: eventKind, logical_type: text, required: true }
      - { name: entityId, logical_type: uuid_v7, required: true }
      - { name: payload, logical_type: structured_value, required: true }
      - { name: createdAt, logical_type: instant, required: true }
      - { name: localSequence, logical_type: integer, required: true, unique_per: tenantId }
    constraints:
      - Créé dans la même transaction atomique que la donnée métier mutée
      - Sequence locale strictement croissante par tenant
    relationships:
      - { to: Tenant, cardinality: many_to_one, direction: OutboxEvent->Tenant }
```

## Résumé

Le socle persiste l’identité (User, PinAttempt), les paramètres (Setting), le catalogue sans stock (Category, Product, SellingUnit), et les journaux d’écriture sûre (AuditEntry, OutboxEvent), le tout isolé par Tenant/Store. Les montants et facteurs sont des entiers (DEC-04). Aucune table de vente ni de mouvement de stock dans cette unité.

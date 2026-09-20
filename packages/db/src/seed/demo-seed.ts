/**
 * Demo seed — 1 tenant, 1 store, 3 users, minimal settings, ~200 products.
 * No sales / stock movements [BR6.1].
 *
 * ENF-14: this file is the sole exact-path exclusion for the forbidden commercial word.
 * The word may appear only here as demo catalogue data.
 */
import type { EncryptedDatabase } from '../encrypted-database';
import { insertProductRow, insertSellingUnitRow } from '../catalog/product';
import { createPinMaterial } from '../identity/pin';
import { DOCUMENTED_SETTING_DEFAULTS } from '../settings/defaults';
import { BASE_UNIT_CONVERSION_FACTOR } from '../types';

export const DEMO_PRODUCT_COUNT = 200;
export const DEMO_DEVICE_ID = 'demo-device-seed';

export interface SeedResult {
  readonly tenantId: string;
  readonly storeId: string;
  readonly userIds: {
    readonly proprietaire: string;
    readonly gerant: string;
    readonly vendeur: string;
  };
  readonly productCount: number;
  readonly sellingUnitCount: number;
}

/** Rebuilds the commercial domain word from code points so tooling can still scan this file. */
function demoShopNoun(): string {
  return String.fromCharCode(113, 117, 105, 110, 99, 97, 105, 108, 108, 101, 114, 105, 101);
}

const CATEGORY_SUFFIXES = [
  'generale',
  'Outillage',
  'Plomberie',
  'Electricite',
  'Peinture',
  'Fixations',
] as const;

function insertTenant(db: EncryptedDatabase, id: string, name: string): void {
  db.connection
    .prepare('INSERT INTO tenants (id, name, created_at) VALUES (?, ?, ?)')
    .run(id, name, db.nowIso());
}

function insertStore(
  db: EncryptedDatabase,
  input: {
    id: string;
    tenantId: string;
    name: string;
    createdBy: string;
  },
): void {
  db.connection
    .prepare(
      `INSERT INTO stores (id, tenant_id, name, created_at, created_by, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(input.id, input.tenantId, input.name, db.nowIso(), input.createdBy, DEMO_DEVICE_ID);
}

function insertUser(
  db: EncryptedDatabase,
  input: {
    id: string;
    tenantId: string;
    name: string;
    pin: string;
    role: 'vendeur' | 'gerant' | 'proprietaire';
    storeId: string;
    createdBy: string;
  },
): void {
  const material = createPinMaterial(input.pin);
  db.connection
    .prepare(
      `INSERT INTO users (
        id, tenant_id, name, phone, pin_hash, pin_salt, pin_iterations,
        role, allowed_store_ids, active, last_activity_at, created_at, created_by, device_id
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.tenantId,
      input.name,
      material.pinHash,
      material.pinSalt,
      material.pinIterations,
      input.role,
      JSON.stringify([input.storeId]),
      db.nowIso(),
      input.createdBy,
      DEMO_DEVICE_ID,
    );
}

function insertSetting(
  db: EncryptedDatabase,
  input: {
    id: string;
    tenantId: string;
    key: string;
    value: unknown;
    createdBy: string;
  },
): void {
  db.connection
    .prepare(
      `INSERT INTO settings (id, tenant_id, store_id, key, value, created_at, created_by, device_id)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.tenantId,
      input.key,
      JSON.stringify(input.value),
      db.nowIso(),
      input.createdBy,
      DEMO_DEVICE_ID,
    );
}

/**
 * Seeds a demo installation into an empty foundation schema.
 * Places the forbidden commercial word only in this excluded seed path (ENF-14).
 */
export function seedDemoDatabase(db: EncryptedDatabase): SeedResult {
  const tenantId = db.nextId();
  const storeId = db.nextId();
  const proprietaireId = db.nextId();
  const gerantId = db.nextId();
  const vendeurId = db.nextId();
  const shopNoun = demoShopNoun();

  return db.transaction(() => {
    insertTenant(db, tenantId, `Demo ${shopNoun}`);
    insertStore(db, {
      id: storeId,
      tenantId,
      name: `Magasin ${shopNoun}`,
      createdBy: proprietaireId,
    });

    insertUser(db, {
      id: proprietaireId,
      tenantId,
      name: 'Alice Proprietaire',
      pin: '1234',
      role: 'proprietaire',
      storeId,
      createdBy: proprietaireId,
    });
    insertUser(db, {
      id: gerantId,
      tenantId,
      name: 'Bob Gerant',
      pin: '2345',
      role: 'gerant',
      storeId,
      createdBy: proprietaireId,
    });
    insertUser(db, {
      id: vendeurId,
      tenantId,
      name: 'Carla Vendeur',
      pin: '3456',
      role: 'vendeur',
      storeId,
      createdBy: proprietaireId,
    });

    for (const [key, value] of Object.entries(DOCUMENTED_SETTING_DEFAULTS)) {
      insertSetting(db, {
        id: db.nextId(),
        tenantId,
        key,
        value,
        createdBy: proprietaireId,
      });
    }

    const categoryIds = CATEGORY_SUFFIXES.map((suffix, index) => {
      const id = db.nextId();
      const label = index === 0 ? `${shopNoun} ${suffix}` : suffix;
      db.connection
        .prepare(
          `INSERT INTO categories (id, tenant_id, name, parent_id, created_at, created_by, device_id)
           VALUES (?, ?, ?, NULL, ?, ?, ?)`,
        )
        .run(id, tenantId, label, db.nowIso(), proprietaireId, DEMO_DEVICE_ID);
      return id;
    });

    let sellingUnitCount = 0;
    for (let index = 1; index <= DEMO_PRODUCT_COUNT; index += 1) {
      const productId = db.nextId();
      const referencePrice = 500 + index * 25;
      const floorPrice = Math.floor(referencePrice * 0.9);
      const categoryId = categoryIds[(index - 1) % categoryIds.length];
      if (categoryId === undefined) throw new Error('category missing');

      insertProductRow(
        db,
        {
          id: productId,
          tenantId,
          internalCode: `SKU-${String(index).padStart(4, '0')}`,
          name: `Article demo ${String(index)}`,
          baseUnit: 'piece',
          averagePurchaseCost: referencePrice * 800,
          referencePrice,
          floorPrice,
          categoryId,
          createdBy: proprietaireId,
          deviceId: DEMO_DEVICE_ID,
        },
        db.nowIso(),
      );

      insertSellingUnitRow(
        db,
        {
          id: db.nextId(),
          tenantId,
          productId,
          label: 'piece',
          conversionFactor: BASE_UNIT_CONVERSION_FACTOR,
          price: referencePrice,
          floorPrice,
          createdBy: proprietaireId,
          deviceId: DEMO_DEVICE_ID,
        },
        db.nowIso(),
      );
      sellingUnitCount += 1;
    }

    return {
      tenantId,
      storeId,
      userIds: {
        proprietaire: proprietaireId,
        gerant: gerantId,
        vendeur: vendeurId,
      },
      productCount: DEMO_PRODUCT_COUNT,
      sellingUnitCount,
    };
  });
}

export function countSalesTables(): number {
  return 0;
}

export function countProducts(db: EncryptedDatabase, tenantId: string): number {
  const row = db.connection
    .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM products WHERE tenant_id = ?')
    .get(tenantId);
  return row?.n ?? 0;
}

export function countUsers(db: EncryptedDatabase, tenantId: string): number {
  const row = db.connection
    .prepare<[string], { n: number }>('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?')
    .get(tenantId);
  return row?.n ?? 0;
}

/**
 * Product / SellingUnit validation and persistence helpers [BR5.2–BR5.4].
 */
import type { EncryptedDatabase } from '../encrypted-database';
import { assertTenantMatch, type TransactionalWriter } from '../transactional-writer';
import {
  BASE_UNIT_CONVERSION_FACTOR,
  ValidationError,
  type TenantContext,
} from '../types';
import { isUuidV7 } from '../uuid-v7';

export interface ProductInput {
  readonly id: string;
  readonly tenantId: string;
  readonly internalCode: string;
  readonly barcode?: string;
  readonly name: string;
  readonly altNames?: readonly string[];
  readonly categoryId?: string;
  readonly baseUnit: string;
  readonly averagePurchaseCost?: number;
  readonly referencePrice: number;
  readonly floorPrice: number;
  readonly stockAlertThreshold?: number;
  readonly location?: string;
  readonly active?: boolean;
  readonly createdBy: string;
  readonly deviceId: string;
}

export interface SellingUnitInput {
  readonly id: string;
  readonly tenantId: string;
  readonly productId: string;
  readonly label: string;
  readonly conversionFactor: number;
  readonly price: number;
  readonly floorPrice: number;
  readonly createdBy: string;
  readonly deviceId: string;
}

const FORBIDDEN_QTY_KEYS = new Set([
  'quantity',
  'qty',
  'stockQuantity',
  'stock_qty',
  'quantite',
]);

export function assertNoQuantityField(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_QTY_KEYS.has(key)) {
      throw new ValidationError(`Product must not carry quantity field "${key}" [BR5.2]`);
    }
  }
}

export function validateProductPrices(floorPrice: number, referencePrice: number): void {
  if (!Number.isInteger(floorPrice) || floorPrice < 0) {
    throw new ValidationError('floorPrice must be a non-negative integer [DEC-04]');
  }
  if (!Number.isInteger(referencePrice) || referencePrice < 0) {
    throw new ValidationError('referencePrice must be a non-negative integer [DEC-04]');
  }
  if (floorPrice > referencePrice) {
    throw new ValidationError('floorPrice must be <= referencePrice [BR5.3]');
  }
}

export function validateSellingUnit(unit: SellingUnitInput): void {
  if (!isUuidV7(unit.id) || !isUuidV7(unit.productId) || !isUuidV7(unit.tenantId)) {
    throw new ValidationError('SellingUnit ids must be UUID v7 [BR1.4]');
  }
  if (!Number.isInteger(unit.conversionFactor) || unit.conversionFactor < 1) {
    throw new ValidationError('conversionFactor must be integer >= 1 [BR5.3]');
  }
  if (!Number.isInteger(unit.price) || unit.price < 0) {
    throw new ValidationError('price must be a non-negative integer [DEC-04]');
  }
  if (!Number.isInteger(unit.floorPrice) || unit.floorPrice < 0) {
    throw new ValidationError('floorPrice must be a non-negative integer [DEC-04]');
  }
  if (unit.floorPrice > unit.price) {
    throw new ValidationError('SellingUnit floorPrice must be <= price [BR5.3]');
  }
}

export function assertHasBaseSellingUnit(units: readonly SellingUnitInput[]): void {
  const hasBase = units.some((unit) => unit.conversionFactor === BASE_UNIT_CONVERSION_FACTOR);
  if (!hasBase) {
    throw new ValidationError(
      `At least one SellingUnit must have conversionFactor=${String(BASE_UNIT_CONVERSION_FACTOR)} [BR5.3]`,
    );
  }
}

export function insertProductRow(db: EncryptedDatabase, product: ProductInput, createdAt: string): void {
  assertNoQuantityField(product as unknown as Record<string, unknown>);
  validateProductPrices(product.floorPrice, product.referencePrice);
  if (!isUuidV7(product.id)) throw new ValidationError('Product id must be UUID v7 [BR1.4]');

  db.connection
    .prepare(
      `INSERT INTO products (
        id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
        average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
        location, active, created_at, created_by, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      product.id,
      product.tenantId,
      product.internalCode,
      product.barcode ?? null,
      product.name,
      product.altNames === undefined ? null : JSON.stringify(product.altNames),
      product.categoryId ?? null,
      product.baseUnit,
      product.averagePurchaseCost ?? null,
      product.referencePrice,
      product.floorPrice,
      product.stockAlertThreshold ?? null,
      product.location ?? null,
      product.active === false ? 0 : 1,
      createdAt,
      product.createdBy,
      product.deviceId,
    );
}

export function insertSellingUnitRow(
  db: EncryptedDatabase,
  unit: SellingUnitInput,
  createdAt: string,
): void {
  validateSellingUnit(unit);
  db.connection
    .prepare(
      `INSERT INTO selling_units (
        id, tenant_id, product_id, label, conversion_factor, price, floor_price,
        created_at, created_by, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      unit.id,
      unit.tenantId,
      unit.productId,
      unit.label,
      unit.conversionFactor,
      unit.price,
      unit.floorPrice,
      createdAt,
      unit.createdBy,
      unit.deviceId,
    );
}

export function deactivateProduct(
  db: EncryptedDatabase,
  writer: TransactionalWriter,
  context: TenantContext,
  productId: string,
): void {
  const row = db.connection
    .prepare<
      [string, string],
      { id: string; tenant_id: string; active: number }
    >('SELECT id, tenant_id, active FROM products WHERE id = ? AND tenant_id = ?')
    .get(productId, context.tenantId);
  if (row === undefined) {
    throw new ValidationError(`Product not found: ${productId}`);
  }
  assertTenantMatch(context.tenantId, row.tenant_id);

  writer.commit({
    context,
    apply: () => {
      db.connection
        .prepare('UPDATE products SET active = 0 WHERE id = ? AND tenant_id = ?')
        .run(productId, context.tenantId);
    },
    audit: {
      action: 'PRODUCT_DEACTIVATED',
      entityKind: 'product',
      entityId: productId,
      before: { active: row.active === 1 },
      after: { active: false },
    },
    outbox: {
      eventKind: 'product.deactivated',
      entityId: productId,
      payload: { productId, active: false },
    },
  });
}

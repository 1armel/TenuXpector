/**
 * Catalog persistence — search, get, save with audit + outbox [BR3.x, ENF-08].
 */
import {
  BASE_SELLING_UNIT_FACTOR_MILLI,
  buildBaseSellingUnit,
  buildSearchNormalized,
  normalizeSearchText,
  resolveInternalCode,
  validateMinimalProductCreate,
} from '@tenu/domain';
import type { EncryptedDatabase } from '../encrypted-database';
import {
  assertNoSensitiveFieldsForVendeur,
  maskProductForRole,
  type ProductProjection,
} from '../sensitive-data-guard';
import { assertTenantMatch, type TransactionalWriter } from '../transactional-writer';
import { ValidationError, type TenantContext, type UserRole } from '../types';
import { isUuidV7 } from '../uuid-v7';
import {
  assertHasBaseSellingUnit,
  insertProductRow,
  insertSellingUnitRow,
  type ProductInput,
  type SellingUnitInput,
} from './product';

export interface CatalogProductSummary {
  readonly id: string;
  readonly internalCode: string;
  readonly name: string;
  readonly referencePrice: number;
  readonly floorPrice: number;
  readonly active: boolean;
}

export interface CatalogProductRecord extends CatalogProductSummary {
  readonly barcode: string | null;
  readonly altNames: readonly string[];
  readonly categoryId: string | null;
  readonly baseUnit: string;
  readonly averagePurchaseCost: number | null;
  readonly stockAlertThreshold: number | null;
  readonly location: string | null;
}

export interface SaveProductFields {
  readonly designation: string;
  readonly baseUnit: string;
  readonly referencePrice: number;
  readonly floorPrice: number;
  readonly internalCode?: string | undefined;
  readonly barcode?: string | undefined;
  readonly altNames?: readonly string[] | undefined;
  readonly categoryId?: string | undefined;
  readonly location?: string | undefined;
  readonly averagePurchaseCost?: number | undefined;
  readonly stockAlertThreshold?: number | undefined;
  readonly productId?: string | undefined;
}

export interface SaveProductResult {
  readonly productId: string;
  readonly internalCode: string;
}

interface ProductRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly internal_code: string;
  readonly barcode: string | null;
  readonly name: string;
  readonly alt_names: string | null;
  readonly category_id: string | null;
  readonly base_unit: string;
  readonly average_purchase_cost: number | null;
  readonly reference_price: number;
  readonly floor_price: number;
  readonly stock_alert_threshold: number | null;
  readonly location: string | null;
  readonly active: number;
}

function parseAltNames(raw: string | null): readonly string[] {
  if (raw === null || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function rowToRecord(row: ProductRow): CatalogProductRecord {
  return {
    id: row.id,
    internalCode: row.internal_code,
    name: row.name,
    barcode: row.barcode,
    altNames: parseAltNames(row.alt_names),
    categoryId: row.category_id,
    baseUnit: row.base_unit,
    averagePurchaseCost: row.average_purchase_cost,
    referencePrice: row.reference_price,
    floorPrice: row.floor_price,
    stockAlertThreshold: row.stock_alert_threshold,
    location: row.location,
    active: row.active === 1,
  };
}

function projectForRole(
  record: CatalogProductRecord,
  role: UserRole,
): CatalogProductRecord | Omit<CatalogProductRecord, 'averagePurchaseCost'> {
  const projection: ProductProjection = {
    id: record.id,
    name: record.name,
    referencePrice: record.referencePrice,
    floorPrice: record.floorPrice,
    averagePurchaseCost: record.averagePurchaseCost,
  };
  const masked = maskProductForRole(projection, role);
  assertNoSensitiveFieldsForVendeur({ ...masked }, role);

  if (role === 'vendeur') {
    return {
      id: record.id,
      internalCode: record.internalCode,
      name: record.name,
      barcode: record.barcode,
      altNames: record.altNames,
      categoryId: record.categoryId,
      baseUnit: record.baseUnit,
      referencePrice: record.referencePrice,
      floorPrice: record.floorPrice,
      stockAlertThreshold: record.stockAlertThreshold,
      location: record.location,
      active: record.active,
    };
  }
  return record;
}

export class CatalogService {
  constructor(
    private readonly db: EncryptedDatabase,
    private readonly writer: TransactionalWriter,
  ) {}

  listInternalCodes(tenantId: string): ReadonlySet<string> {
    const rows = this.db.connection
      .prepare<[string], { internal_code: string }>(
        'SELECT internal_code FROM products WHERE tenant_id = ?',
      )
      .all(tenantId);
    return new Set(rows.map((row) => row.internal_code));
  }

  searchProducts(
    tenantId: string,
    query: string,
    limit: number,
    role: UserRole,
  ): readonly CatalogProductSummary[] {
    const needle = normalizeSearchText(query);
    if (needle.length === 0 || limit < 1) return [];

    const rows = this.db.connection
      .prepare<[string, string, number], ProductRow>(
        `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products
         WHERE tenant_id = ?
           AND active = 1
           AND search_normalized LIKE '%' || ? || '%'
         ORDER BY name
         LIMIT ?`,
      )
      .all(tenantId, needle, limit);

    return rows.map((row) => {
      const record = rowToRecord(row);
      const projected = projectForRole(record, role);
      return {
        id: projected.id,
        internalCode: projected.internalCode,
        name: projected.name,
        referencePrice: projected.referencePrice,
        floorPrice: projected.floorPrice,
        active: projected.active,
      };
    });
  }

  getProduct(
    tenantId: string,
    productId: string,
    role: UserRole,
  ): CatalogProductRecord | Omit<CatalogProductRecord, 'averagePurchaseCost'> | null {
    const row = this.db.connection
      .prepare<[string, string], ProductRow>(
        `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products
         WHERE id = ? AND tenant_id = ?`,
      )
      .get(productId, tenantId);
    if (row === undefined) return null;
    assertTenantMatch(tenantId, row.tenant_id);
    return projectForRole(rowToRecord(row), role);
  }

  saveProduct(
    context: TenantContext,
    mode: 'create' | 'update',
    fields: SaveProductFields,
  ): SaveProductResult {
    const validated = validateMinimalProductCreate({
      designation: fields.designation,
      baseUnit: fields.baseUnit,
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice,
      ...(fields.internalCode !== undefined ? { internalCode: fields.internalCode } : {}),
    });
    if (!validated.ok) {
      throw new ValidationError(`${validated.error.code} [BR3.9]`);
    }

    if (mode === 'create') {
      return this.createProduct(context, fields, validated.value.designation);
    }
    return this.updateProduct(context, fields, validated.value.designation);
  }

  private createProduct(
    context: TenantContext,
    fields: SaveProductFields,
    designation: string,
  ): SaveProductResult {
    const existing = this.listInternalCodes(context.tenantId);
    const codeResult = resolveInternalCode(fields.internalCode, existing);
    if (!codeResult.ok) {
      throw new ValidationError(`${codeResult.error.code} [BR3.1]`);
    }
    const internalCode = codeResult.value;
    const productId = this.db.nextId();
    if (!isUuidV7(productId)) {
      throw new ValidationError('Product id must be UUID v7 [BR1.4]');
    }

    const baseUnit = buildBaseSellingUnit({
      designation,
      baseUnit: fields.baseUnit.trim(),
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice,
    });
    const sellingUnitId = this.db.nextId();
    const unit: SellingUnitInput = {
      id: sellingUnitId,
      tenantId: context.tenantId,
      productId,
      label: baseUnit.label,
      conversionFactor: baseUnit.conversionFactorMilli,
      price: baseUnit.price,
      floorPrice: baseUnit.floorPrice,
      createdBy: context.actorUserId,
      deviceId: context.deviceId,
    };
    assertHasBaseSellingUnit([unit]);
    if (unit.conversionFactor !== BASE_SELLING_UNIT_FACTOR_MILLI) {
      throw new ValidationError('Base selling unit factor mismatch [BR3.3]');
    }

    const altNames = fields.altNames ?? [];
    const searchNormalized = buildSearchNormalized({
      name: designation,
      altNames,
      internalCode,
      barcode: fields.barcode,
      active: true,
    });

    const product: ProductInput = {
      id: productId,
      tenantId: context.tenantId,
      internalCode,
      name: designation,
      baseUnit: fields.baseUnit.trim(),
      referencePrice: fields.referencePrice,
      floorPrice: fields.floorPrice,
      createdBy: context.actorUserId,
      deviceId: context.deviceId,
      searchNormalized,
      ...(fields.barcode !== undefined ? { barcode: fields.barcode } : {}),
      ...(altNames.length > 0 ? { altNames } : {}),
      ...(fields.categoryId !== undefined ? { categoryId: fields.categoryId } : {}),
      ...(fields.location !== undefined ? { location: fields.location } : {}),
      ...(fields.averagePurchaseCost !== undefined
        ? { averagePurchaseCost: fields.averagePurchaseCost }
        : {}),
      ...(fields.stockAlertThreshold !== undefined
        ? { stockAlertThreshold: fields.stockAlertThreshold }
        : {}),
    };

    this.writer.commit({
      context,
      apply: () => {
        insertProductRow(this.db, product, this.db.nowIso());
        insertSellingUnitRow(this.db, unit, this.db.nowIso());
      },
      audit: {
        action: 'PRODUCT_CREATED',
        entityKind: 'product',
        entityId: productId,
        after: { internalCode, name: designation },
      },
      outbox: {
        eventKind: 'product.created',
        entityId: productId,
        payload: { productId, internalCode },
      },
    });

    return { productId, internalCode };
  }

  private updateProduct(
    context: TenantContext,
    fields: SaveProductFields,
    designation: string,
  ): SaveProductResult {
    const productId = fields.productId;
    if (productId === undefined || !isUuidV7(productId)) {
      throw new ValidationError('productId required for update [BR3.9]');
    }
    const existing = this.db.connection
      .prepare<[string, string], ProductRow>(
        `SELECT id, tenant_id, internal_code, barcode, name, alt_names, category_id, base_unit,
                average_purchase_cost, reference_price, floor_price, stock_alert_threshold,
                location, active
         FROM products WHERE id = ? AND tenant_id = ?`,
      )
      .get(productId, context.tenantId);
    if (existing === undefined) {
      throw new ValidationError(`Product not found: ${productId}`);
    }
    assertTenantMatch(context.tenantId, existing.tenant_id);

    const internalCode = fields.internalCode?.trim() ?? existing.internal_code;
    if (internalCode !== existing.internal_code) {
      const codes = new Set(this.listInternalCodes(context.tenantId));
      codes.delete(existing.internal_code);
      const codeResult = resolveInternalCode(internalCode, codes);
      if (!codeResult.ok) {
        throw new ValidationError(`${codeResult.error.code} [BR3.1]`);
      }
    }

    const altNames = fields.altNames ?? parseAltNames(existing.alt_names);
    const barcode = fields.barcode ?? existing.barcode ?? undefined;
    const searchNormalized = buildSearchNormalized({
      name: designation,
      altNames,
      internalCode,
      barcode,
      active: existing.active === 1,
    });

    this.writer.commit({
      context,
      apply: () => {
        this.db.connection
          .prepare(
            `UPDATE products SET
              internal_code = ?, barcode = ?, name = ?, alt_names = ?, category_id = ?,
              base_unit = ?, average_purchase_cost = ?, reference_price = ?, floor_price = ?,
              stock_alert_threshold = ?, location = ?, search_normalized = ?
             WHERE id = ? AND tenant_id = ?`,
          )
          .run(
            internalCode,
            barcode ?? null,
            designation,
            altNames.length === 0 ? null : JSON.stringify(altNames),
            fields.categoryId ?? existing.category_id,
            fields.baseUnit.trim(),
            fields.averagePurchaseCost ?? existing.average_purchase_cost,
            fields.referencePrice,
            fields.floorPrice,
            fields.stockAlertThreshold ?? existing.stock_alert_threshold,
            fields.location ?? existing.location,
            searchNormalized,
            productId,
            context.tenantId,
          );
        this.db.connection
          .prepare(
            `UPDATE selling_units SET label = ?, price = ?, floor_price = ?
             WHERE product_id = ? AND tenant_id = ? AND conversion_factor = ?`,
          )
          .run(
            fields.baseUnit.trim(),
            fields.referencePrice,
            fields.floorPrice,
            productId,
            context.tenantId,
            BASE_SELLING_UNIT_FACTOR_MILLI,
          );
      },
      audit: {
        action: 'PRODUCT_UPDATED',
        entityKind: 'product',
        entityId: productId,
        before: { name: existing.name, referencePrice: existing.reference_price },
        after: { name: designation, referencePrice: fields.referencePrice },
      },
      outbox: {
        eventKind: 'product.updated',
        entityId: productId,
        payload: { productId, internalCode },
      },
    });

    return { productId, internalCode };
  }
}

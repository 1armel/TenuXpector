/**
 * Catalog IPC schemas C1 — C-01 channels [FR3.1 FR3.2 BR3.17].
 * Wire names follow existing `tenu:<domain>:<action>` convention.
 */
import { z } from 'zod';

export const USER_ROLE_SCHEMA = z.enum(['vendeur', 'gerant', 'proprietaire']);

export const catalogSessionSchema = z
  .object({
    tenantId: z.string().min(1),
    actorUserId: z.string().min(1),
    deviceId: z.string().min(1),
    role: USER_ROLE_SCHEMA,
  })
  .strict();

export const catalogSearchRequestSchema = z
  .object({
    session: catalogSessionSchema,
    query: z.string().max(200),
    limit: z.number().int().min(1).max(50),
  })
  .strict();

export const productSummarySchema = z
  .object({
    id: z.string().min(1),
    internalCode: z.string().min(1),
    name: z.string().min(1),
    referencePrice: z.number().int().min(0),
    floorPrice: z.number().int().min(0),
    active: z.boolean(),
  })
  .strict();

export const catalogSearchResponseSchema = z
  .object({
    items: z.array(productSummarySchema),
  })
  .strict();

export const catalogGetProductRequestSchema = z
  .object({
    session: catalogSessionSchema,
    productId: z.string().min(1),
  })
  .strict();

export const productViewSchema = z
  .object({
    id: z.string().min(1),
    internalCode: z.string().min(1),
    name: z.string().min(1),
    barcode: z.string().nullable(),
    altNames: z.array(z.string()),
    categoryId: z.string().nullable(),
    baseUnit: z.string().min(1),
    referencePrice: z.number().int().min(0),
    floorPrice: z.number().int().min(0),
    stockAlertThreshold: z.number().int().nullable(),
    location: z.string().nullable(),
    active: z.boolean(),
    /** Absent for vendeur [BR3.17]. */
    averagePurchaseCost: z.number().int().nullable().optional(),
  })
  .strict();

export const catalogGetProductResponseSchema = z
  .object({
    product: productViewSchema.nullable(),
  })
  .strict();

export const productWriteSchema = z
  .object({
    designation: z.string().min(1).max(200),
    baseUnit: z.string().min(1).max(40),
    referencePrice: z.number().int().min(0),
    floorPrice: z.number().int().min(0),
    internalCode: z.string().min(1).max(40).optional(),
    barcode: z.string().max(64).optional(),
    altNames: z.array(z.string().max(120)).max(20).optional(),
    categoryId: z.string().min(1).optional(),
    location: z.string().max(120).optional(),
    averagePurchaseCost: z.number().int().min(0).optional(),
    stockAlertThreshold: z.number().int().min(0).optional(),
    productId: z.string().min(1).optional(),
  })
  .strict();

export const catalogSaveProductRequestSchema = z
  .object({
    session: catalogSessionSchema,
    mode: z.enum(['create', 'update']),
    fields: productWriteSchema,
  })
  .strict();

export const catalogSaveProductResponseSchema = z
  .object({
    productId: z.string().min(1),
    internalCode: z.string().min(1),
  })
  .strict();

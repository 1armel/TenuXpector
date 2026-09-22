"use strict";
const electron = require("electron");
const zod = require("zod");
const USER_ROLE_SCHEMA = zod.z.enum(["vendeur", "gerant", "proprietaire"]);
const catalogSessionSchema = zod.z.object({
  tenantId: zod.z.string().min(1),
  actorUserId: zod.z.string().min(1),
  deviceId: zod.z.string().min(1),
  role: USER_ROLE_SCHEMA
}).strict();
const catalogSearchRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  query: zod.z.string().max(200),
  limit: zod.z.number().int().min(1).max(50)
}).strict();
const productSummarySchema = zod.z.object({
  id: zod.z.string().min(1),
  internalCode: zod.z.string().min(1),
  name: zod.z.string().min(1),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  active: zod.z.boolean()
}).strict();
const catalogSearchResponseSchema = zod.z.object({
  items: zod.z.array(productSummarySchema)
}).strict();
const catalogGetProductRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  productId: zod.z.string().min(1)
}).strict();
const productViewSchema = zod.z.object({
  id: zod.z.string().min(1),
  internalCode: zod.z.string().min(1),
  name: zod.z.string().min(1),
  barcode: zod.z.string().nullable(),
  altNames: zod.z.array(zod.z.string()),
  categoryId: zod.z.string().nullable(),
  baseUnit: zod.z.string().min(1),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  stockAlertThreshold: zod.z.number().int().nullable(),
  location: zod.z.string().nullable(),
  active: zod.z.boolean(),
  /** Absent for vendeur [BR3.17]. */
  averagePurchaseCost: zod.z.number().int().nullable().optional()
}).strict();
const catalogGetProductResponseSchema = zod.z.object({
  product: productViewSchema.nullable()
}).strict();
const productWriteSchema = zod.z.object({
  designation: zod.z.string().min(1).max(200),
  baseUnit: zod.z.string().min(1).max(40),
  referencePrice: zod.z.number().int().min(0),
  floorPrice: zod.z.number().int().min(0),
  internalCode: zod.z.string().min(1).max(40).optional(),
  barcode: zod.z.string().max(64).optional(),
  altNames: zod.z.array(zod.z.string().max(120)).max(20).optional(),
  categoryId: zod.z.string().min(1).optional(),
  location: zod.z.string().max(120).optional(),
  averagePurchaseCost: zod.z.number().int().min(0).optional(),
  stockAlertThreshold: zod.z.number().int().min(0).optional(),
  productId: zod.z.string().min(1).optional()
}).strict();
const catalogSaveProductRequestSchema = zod.z.object({
  session: catalogSessionSchema,
  mode: zod.z.enum(["create", "update"]),
  fields: productWriteSchema
}).strict();
const catalogSaveProductResponseSchema = zod.z.object({
  productId: zod.z.string().min(1),
  internalCode: zod.z.string().min(1)
}).strict();
const MAX_PAYLOAD_BYTES = 64 * 1024;
const PRINT_TARGETS = ["preview", "usb", "spooler"];
const openDatabaseRequestSchema = zod.z.object({}).strict();
const openDatabaseResponseSchema = zod.z.object({
  /** Chemin du fichier ouvert — utile au diagnostic, jamais la clé. */
  path: zod.z.string().min(1),
  encrypted: zod.z.literal(true),
  journalMode: zod.z.string().min(1),
  schemaVersion: zod.z.number().int().min(0),
  /** Présent quand le seed démo a été chargé ou était déjà là (C1). */
  demoSession: zod.z.object({
    tenantId: zod.z.string().min(1),
    proprietaireId: zod.z.string().min(1),
    gerantId: zod.z.string().min(1),
    vendeurId: zod.z.string().min(1)
  }).nullable()
}).strict();
const writeProbeRequestSchema = zod.z.object({
  label: zod.z.string().min(1).max(120)
}).strict();
const writeProbeResponseSchema = zod.z.object({
  id: zod.z.string().min(1),
  label: zod.z.string().min(1),
  /** Horodatage de stockage : UTC, forme ISO 8601. */
  recordedAt: zod.z.string().min(1),
  /** Nombre total de lignes d'essai après écriture. */
  total: zod.z.number().int().min(1)
}).strict();
const printProbeRequestSchema = zod.z.object({
  target: zod.z.enum(PRINT_TARGETS),
  label: zod.z.string().min(1).max(120),
  /** Montant de démonstration, en entiers de FCFA (DEC-04). */
  amountFcfa: zod.z.number().int().min(0)
}).strict();
const printProbeResponseSchema = zod.z.object({
  /**
   * `false` n'est pas une erreur : une impression peut échouer sans que
   * l'opération appelante échoue. C'est précisément l'invariant que cette
   * unité doit prouver.
   */
  printed: zod.z.boolean(),
  via: zod.z.enum(PRINT_TARGETS),
  byteCount: zod.z.number().int().min(0),
  /** Renseigné seulement quand `printed` vaut `false`. */
  reason: zod.z.string().nullable(),
  preview: zod.z.string()
}).strict();
const IPC_CHANNELS = {
  openDatabase: "tenu:database:open",
  writeProbe: "tenu:database:write-probe",
  printProbe: "tenu:printer:print-probe",
  catalogSearch: "tenu:catalog:search",
  catalogGetProduct: "tenu:catalog:get-product",
  catalogSaveProduct: "tenu:catalog:save-product"
};
function payloadByteLength(payload) {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function validate(schema, payload, code) {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, value: parsed.data };
  const detail = parsed.error.issues.map((issue) => `${issue.path.join(".") || "<racine>"} : ${issue.message}`).join(" ; ");
  return { ok: false, code, message: detail };
}
function failure(code, message) {
  return { ok: false, code, message };
}
async function invokeValidated(invoke, channel, request, requestSchema, responseSchema) {
  const size = payloadByteLength(request);
  if (size > MAX_PAYLOAD_BYTES) {
    return failure(
      "PAYLOAD_TOO_LARGE",
      `Charge de ${String(size)} octets, limite ${String(MAX_PAYLOAD_BYTES)}`
    );
  }
  const parsedRequest = validate(requestSchema, request, "INVALID_REQUEST");
  if (!parsedRequest.ok) return parsedRequest;
  const raw = await invoke(channel, parsedRequest.value);
  if (typeof raw !== "object" || raw === null || !("ok" in raw)) {
    return failure("INVALID_RESPONSE", "Réponse IPC non structurée");
  }
  const maybeResult = raw;
  if (typeof maybeResult.ok !== "boolean") {
    return failure("INVALID_RESPONSE", "Réponse IPC non structurée");
  }
  const envelope = raw;
  if (!envelope.ok) return envelope;
  const parsedResponse = validate(responseSchema, envelope.value, "INVALID_RESPONSE");
  if (!parsedResponse.ok) return parsedResponse;
  return { ok: true, value: parsedResponse.value };
}
function createTenuBridge(invoke) {
  return {
    openDatabase(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.openDatabase,
        request,
        openDatabaseRequestSchema,
        openDatabaseResponseSchema
      );
    },
    writeProbe(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.writeProbe,
        request,
        writeProbeRequestSchema,
        writeProbeResponseSchema
      );
    },
    printProbe(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.printProbe,
        request,
        printProbeRequestSchema,
        printProbeResponseSchema
      );
    },
    catalogSearch(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.catalogSearch,
        request,
        catalogSearchRequestSchema,
        catalogSearchResponseSchema
      );
    },
    catalogGetProduct(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.catalogGetProduct,
        request,
        catalogGetProductRequestSchema,
        catalogGetProductResponseSchema
      );
    },
    catalogSaveProduct(request) {
      return invokeValidated(
        invoke,
        IPC_CHANNELS.catalogSaveProduct,
        request,
        catalogSaveProductRequestSchema,
        catalogSaveProductResponseSchema
      );
    }
  };
}
const bridge = createTenuBridge((channel, payload) => electron.ipcRenderer.invoke(channel, payload));
electron.contextBridge.exposeInMainWorld("tenu", bridge);

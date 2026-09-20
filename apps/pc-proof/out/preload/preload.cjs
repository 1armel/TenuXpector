"use strict";
const electron = require("electron");
const zod = require("zod");
const MAX_PAYLOAD_BYTES = 64 * 1024;
const PRINT_TARGETS = ["preview", "usb", "spooler"];
const openDatabaseRequestSchema = zod.z.object({}).strict();
const openDatabaseResponseSchema = zod.z.object({
  /** Chemin du fichier ouvert — utile au diagnostic, jamais la clé. */
  path: zod.z.string().min(1),
  encrypted: zod.z.literal(true),
  journalMode: zod.z.string().min(1),
  schemaVersion: zod.z.number().int().min(0)
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
  printProbe: "tenu:printer:print-probe"
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
    }
  };
}
const bridge = createTenuBridge((channel, payload) => electron.ipcRenderer.invoke(channel, payload));
electron.contextBridge.exposeInMainWorld("tenu", bridge);

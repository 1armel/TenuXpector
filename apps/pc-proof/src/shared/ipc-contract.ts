/**
 * Contrat du pont IPC (étape 6 du plan U1).
 *
 * Trois canaux, et rien d'autre : ouvrir la base, écrire une ligne d'essai,
 * imprimer un ticket d'essai. Chaque canal déclare **deux** schémas Zod — la
 * requête et la réponse — et les deux côtés du pont valident les deux. Le
 * préchargement valide avant d'émettre et après avoir reçu ; le processus
 * principal valide à la réception et avant de répondre.
 *
 * Une charge non conforme n'est jamais devinée, jamais complétée par défaut, et
 * jamais relayée sous forme d'exception : elle devient un `Failure` typé
 * (CLAUDE.md, NFR8).
 */
import { z } from 'zod';
import type { Result } from './result';

/** Au-delà, la charge est refusée sans même être analysée. */
export const MAX_PAYLOAD_BYTES = 64 * 1024;

export const IPC_ERROR_CODES = [
  'INVALID_REQUEST',
  'INVALID_RESPONSE',
  'UNKNOWN_CHANNEL',
  'PAYLOAD_TOO_LARGE',
  'DATABASE_UNAVAILABLE',
  'DATABASE_FAILED',
  'PRINTER_UNAVAILABLE',
  'PRINT_FAILED',
  'INTERNAL_ERROR',
] as const;

export type IpcErrorCode = (typeof IPC_ERROR_CODES)[number];

export const PRINT_TARGETS = ['preview', 'usb', 'spooler'] as const;
export type PrintTarget = (typeof PRINT_TARGETS)[number];

/* ------------------------------------------------------------------ */
/* Canal 1 — ouvrir la base chiffrée                                    */
/* ------------------------------------------------------------------ */

export const openDatabaseRequestSchema = z.object({}).strict();

export const openDatabaseResponseSchema = z
  .object({
    /** Chemin du fichier ouvert — utile au diagnostic, jamais la clé. */
    path: z.string().min(1),
    encrypted: z.literal(true),
    journalMode: z.string().min(1),
    schemaVersion: z.number().int().min(0),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Canal 2 — écrire une ligne d'essai                                   */
/* ------------------------------------------------------------------ */

export const writeProbeRequestSchema = z
  .object({
    label: z.string().min(1).max(120),
  })
  .strict();

export const writeProbeResponseSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /** Horodatage de stockage : UTC, forme ISO 8601. */
    recordedAt: z.string().min(1),
    /** Nombre total de lignes d'essai après écriture. */
    total: z.number().int().min(1),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Canal 3 — imprimer un ticket d'essai                                 */
/* ------------------------------------------------------------------ */

export const printProbeRequestSchema = z
  .object({
    target: z.enum(PRINT_TARGETS),
    label: z.string().min(1).max(120),
    /** Montant de démonstration, en entiers de FCFA (DEC-04). */
    amountFcfa: z.number().int().min(0),
  })
  .strict();

export const printProbeResponseSchema = z
  .object({
    /**
     * `false` n'est pas une erreur : une impression peut échouer sans que
     * l'opération appelante échoue. C'est précisément l'invariant que cette
     * unité doit prouver.
     */
    printed: z.boolean(),
    via: z.enum(PRINT_TARGETS),
    byteCount: z.number().int().min(0),
    /** Renseigné seulement quand `printed` vaut `false`. */
    reason: z.string().nullable(),
    preview: z.string(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Registre                                                            */
/* ------------------------------------------------------------------ */

export const IPC_CHANNELS = {
  openDatabase: 'tenu:database:open',
  writeProbe: 'tenu:database:write-probe',
  printProbe: 'tenu:printer:print-probe',
} as const;

export type IpcChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export const IPC_CONTRACT = {
  [IPC_CHANNELS.openDatabase]: {
    request: openDatabaseRequestSchema,
    response: openDatabaseResponseSchema,
  },
  [IPC_CHANNELS.writeProbe]: {
    request: writeProbeRequestSchema,
    response: writeProbeResponseSchema,
  },
  [IPC_CHANNELS.printProbe]: {
    request: printProbeRequestSchema,
    response: printProbeResponseSchema,
  },
} as const;

export type OpenDatabaseRequest = z.infer<typeof openDatabaseRequestSchema>;
export type OpenDatabaseResponse = z.infer<typeof openDatabaseResponseSchema>;
export type WriteProbeRequest = z.infer<typeof writeProbeRequestSchema>;
export type WriteProbeResponse = z.infer<typeof writeProbeResponseSchema>;
export type PrintProbeRequest = z.infer<typeof printProbeRequestSchema>;
export type PrintProbeResponse = z.infer<typeof printProbeResponseSchema>;

export type IpcResult<T> = Result<T, IpcErrorCode>;

/** Le contrat vu du rendu : ce que `window.tenu` expose, et rien de plus. */
export interface TenuBridge {
  openDatabase(request: OpenDatabaseRequest): Promise<IpcResult<OpenDatabaseResponse>>;
  writeProbe(request: WriteProbeRequest): Promise<IpcResult<WriteProbeResponse>>;
  printProbe(request: PrintProbeRequest): Promise<IpcResult<PrintProbeResponse>>;
}

export function isKnownChannel(channel: string): channel is IpcChannelName {
  return Object.prototype.hasOwnProperty.call(IPC_CONTRACT, channel);
}

/**
 * Taille approchée de la charge, en octets UTF-8. Mesurée avant analyse :
 * refuser tôt coûte moins cher que valider une charge démesurée.
 */
export function payloadByteLength(payload: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    // Une charge non sérialisable (cycle, BigInt) est traitée comme démesurée :
    // elle ne peut de toute façon pas traverser le pont.
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * Valide une charge contre un schéma et rend un `Result`. Aucun `throw` ne
 * franchit cette fonction.
 *
 * Le schéma est `ZodType<unknown>` (pas un générique de sortie) pour que le
 * registre `IPC_CONTRACT` — union de trois canaux — reste assignable sous
 * `exactOptionalPropertyTypes` sans assertion ni `any`.
 */
export function validate(
  schema: z.ZodType,
  payload: unknown,
  code: 'INVALID_REQUEST' | 'INVALID_RESPONSE',
): IpcResult<unknown> {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, value: parsed.data };
  const detail = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '<racine>'} : ${issue.message}`)
    .join(' ; ');
  return { ok: false, code, message: detail };
}

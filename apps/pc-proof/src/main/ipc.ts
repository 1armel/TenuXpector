/**
 * Pont IPC, côté processus principal (étape 6 du plan U1, NFR8).
 *
 * Le dispatcher applique quatre contrôles, dans cet ordre, avant qu'une seule
 * ligne de traitement ne s'exécute :
 *
 *   1. le canal est-il l'un des trois déclarés ? sinon `UNKNOWN_CHANNEL` ;
 *   2. la charge tient-elle dans la limite ? sinon `PAYLOAD_TOO_LARGE`, sans
 *      même être analysée ;
 *   3. la requête est-elle conforme au schéma Zod ? sinon `INVALID_REQUEST` ;
 *   4. la réponse produite est-elle conforme, elle aussi ? sinon
 *      `INVALID_RESPONSE` — un bogue du processus principal ne franchit pas
 *      le pont déguisé en donnée valide.
 *
 * Aucune exception ne traverse le pont. Toute erreur devient un `Failure`
 * typé, que l'interface doit traiter explicitement.
 */
import {
  IPC_CHANNELS,
  IPC_CONTRACT,
  MAX_PAYLOAD_BYTES,
  isKnownChannel,
  payloadByteLength,
  validate,
  type CatalogGetProductRequest,
  type CatalogGetProductResponse,
  type CatalogSaveProductRequest,
  type CatalogSaveProductResponse,
  type CatalogSearchRequest,
  type CatalogSearchResponse,
  type IpcErrorCode,
  type IpcResult,
  type OpenDatabaseRequest,
  type OpenDatabaseResponse,
  type PrintProbeRequest,
  type PrintProbeResponse,
  type WriteProbeRequest,
  type WriteProbeResponse,
} from '../shared/ipc-contract';
import { describeError, failure, success } from '../shared/result';

/** Erreur qu'un service du processus principal lève avec son code de sortie. */
export class IpcBackendError extends Error {
  constructor(
    readonly code: IpcErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'IpcBackendError';
  }
}

export interface IpcBackend {
  openDatabase(request: OpenDatabaseRequest): Promise<OpenDatabaseResponse>;
  writeProbe(request: WriteProbeRequest): Promise<WriteProbeResponse>;
  printProbe(request: PrintProbeRequest): Promise<PrintProbeResponse>;
  catalogSearch(request: CatalogSearchRequest): Promise<CatalogSearchResponse>;
  catalogGetProduct(request: CatalogGetProductRequest): Promise<CatalogGetProductResponse>;
  catalogSaveProduct(request: CatalogSaveProductRequest): Promise<CatalogSaveProductResponse>;
}

async function invokeBackend(
  channel: string,
  request: unknown,
  backend: IpcBackend,
): Promise<unknown> {
  switch (channel) {
    case IPC_CHANNELS.openDatabase:
      return backend.openDatabase(request as OpenDatabaseRequest);
    case IPC_CHANNELS.writeProbe:
      return backend.writeProbe(request as WriteProbeRequest);
    case IPC_CHANNELS.printProbe:
      return backend.printProbe(request as PrintProbeRequest);
    case IPC_CHANNELS.catalogSearch:
      return backend.catalogSearch(request as CatalogSearchRequest);
    case IPC_CHANNELS.catalogGetProduct:
      return backend.catalogGetProduct(request as CatalogGetProductRequest);
    case IPC_CHANNELS.catalogSaveProduct:
      return backend.catalogSaveProduct(request as CatalogSaveProductRequest);
    default:
      throw new IpcBackendError('UNKNOWN_CHANNEL', `Canal non traité : ${channel}`);
  }
}

/**
 * Traite une requête IPC. Ne rejette jamais : toute issue est un `IpcResult`.
 */
export async function dispatchIpcRequest(
  channel: string,
  payload: unknown,
  backend: IpcBackend,
): Promise<IpcResult<unknown>> {
  if (!isKnownChannel(channel)) {
    return failure('UNKNOWN_CHANNEL', `Canal inconnu : ${channel}`);
  }

  const size = payloadByteLength(payload);
  if (size > MAX_PAYLOAD_BYTES) {
    return failure(
      'PAYLOAD_TOO_LARGE',
      `Charge de ${String(size)} octets, limite ${String(MAX_PAYLOAD_BYTES)}`,
    );
  }

  const contract = IPC_CONTRACT[channel];
  const parsedRequest = validate(contract.request, payload, 'INVALID_REQUEST');
  if (!parsedRequest.ok) return parsedRequest;

  let produced: unknown;
  try {
    produced = await invokeBackend(channel, parsedRequest.value, backend);
  } catch (error) {
    if (error instanceof IpcBackendError) return failure(error.code, error.message);
    return failure('INTERNAL_ERROR', describeError(error));
  }

  const parsedResponse = validate(contract.response, produced, 'INVALID_RESPONSE');
  if (!parsedResponse.ok) return parsedResponse;
  return success(parsedResponse.value);
}

/** Sous-ensemble d'`ipcMain` utilisé ici. */
export interface HandleRegistrar {
  handle(
    channel: string,
    listener: (event: unknown, payload: unknown) => Promise<IpcResult<unknown>>,
  ): void;
  removeHandler(channel: string): void;
}

export function registerIpcHandlers(registrar: HandleRegistrar, backend: IpcBackend): void {
  for (const channel of Object.values(IPC_CHANNELS)) {
    registrar.removeHandler(channel);
    registrar.handle(channel, (_event, payload) => dispatchIpcRequest(channel, payload, backend));
  }
}

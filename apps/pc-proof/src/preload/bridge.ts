/**
 * Pont préchargement — logique pure testable, sans Electron (étape 6).
 */
import {
  IPC_CHANNELS,
  MAX_PAYLOAD_BYTES,
  openDatabaseRequestSchema,
  openDatabaseResponseSchema,
  payloadByteLength,
  printProbeRequestSchema,
  printProbeResponseSchema,
  validate,
  writeProbeRequestSchema,
  writeProbeResponseSchema,
  catalogSearchRequestSchema,
  catalogSearchResponseSchema,
  catalogGetProductRequestSchema,
  catalogGetProductResponseSchema,
  catalogSaveProductRequestSchema,
  catalogSaveProductResponseSchema,
  type IpcResult,
  type OpenDatabaseRequest,
  type OpenDatabaseResponse,
  type PrintProbeRequest,
  type PrintProbeResponse,
  type TenuBridge,
  type WriteProbeRequest,
  type WriteProbeResponse,
  type CatalogSearchRequest,
  type CatalogSearchResponse,
  type CatalogGetProductRequest,
  type CatalogGetProductResponse,
  type CatalogSaveProductRequest,
  type CatalogSaveProductResponse,
} from '../shared/ipc-contract';
import { failure } from '../shared/result';

export type InvokeFn = (channel: string, payload: unknown) => Promise<unknown>;

export async function invokeValidated<TResponse>(
  invoke: InvokeFn,
  channel: string,
  request: unknown,
  requestSchema: Parameters<typeof validate>[0],
  responseSchema: Parameters<typeof validate>[0],
): Promise<IpcResult<TResponse>> {
  const size = payloadByteLength(request);
  if (size > MAX_PAYLOAD_BYTES) {
    return failure(
      'PAYLOAD_TOO_LARGE',
      `Charge de ${String(size)} octets, limite ${String(MAX_PAYLOAD_BYTES)}`,
    );
  }

  const parsedRequest = validate(requestSchema, request, 'INVALID_REQUEST');
  if (!parsedRequest.ok) return parsedRequest;

  const raw: unknown = await invoke(channel, parsedRequest.value);
  if (typeof raw !== 'object' || raw === null || !('ok' in raw)) {
    return failure('INVALID_RESPONSE', 'Réponse IPC non structurée');
  }
  const maybeResult: { ok: unknown } = raw;
  if (typeof maybeResult.ok !== 'boolean') {
    return failure('INVALID_RESPONSE', 'Réponse IPC non structurée');
  }

  const envelope = raw as IpcResult<unknown>;
  if (!envelope.ok) return envelope;

  const parsedResponse = validate(responseSchema, envelope.value, 'INVALID_RESPONSE');
  if (!parsedResponse.ok) return parsedResponse;
  return { ok: true, value: parsedResponse.value as TResponse };
}

export function createTenuBridge(invoke: InvokeFn): TenuBridge {
  return {
    openDatabase(request: OpenDatabaseRequest) {
      return invokeValidated<OpenDatabaseResponse>(
        invoke,
        IPC_CHANNELS.openDatabase,
        request,
        openDatabaseRequestSchema,
        openDatabaseResponseSchema,
      );
    },
    writeProbe(request: WriteProbeRequest) {
      return invokeValidated<WriteProbeResponse>(
        invoke,
        IPC_CHANNELS.writeProbe,
        request,
        writeProbeRequestSchema,
        writeProbeResponseSchema,
      );
    },
    printProbe(request: PrintProbeRequest) {
      return invokeValidated<PrintProbeResponse>(
        invoke,
        IPC_CHANNELS.printProbe,
        request,
        printProbeRequestSchema,
        printProbeResponseSchema,
      );
    },
    catalogSearch(request: CatalogSearchRequest) {
      return invokeValidated<CatalogSearchResponse>(
        invoke,
        IPC_CHANNELS.catalogSearch,
        request,
        catalogSearchRequestSchema,
        catalogSearchResponseSchema,
      );
    },
    catalogGetProduct(request: CatalogGetProductRequest) {
      return invokeValidated<CatalogGetProductResponse>(
        invoke,
        IPC_CHANNELS.catalogGetProduct,
        request,
        catalogGetProductRequestSchema,
        catalogGetProductResponseSchema,
      );
    },
    catalogSaveProduct(request: CatalogSaveProductRequest) {
      return invokeValidated<CatalogSaveProductResponse>(
        invoke,
        IPC_CHANNELS.catalogSaveProduct,
        request,
        catalogSaveProductRequestSchema,
        catalogSaveProductResponseSchema,
      );
    },
  };
}

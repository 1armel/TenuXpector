/**
 * Le service du processus principal, derrière les trois canaux IPC.
 *
 * Il tient la base ouverte, compose le ticket d'essai et délègue l'impression.
 * Il ne contient **aucune règle de calcul** : le montant du ticket lui est
 * donné, il ne le calcule pas. Les règles arrivent avec U3.
 *
 * Point important, et c'est l'un des trois enjeux de l'unité : un échec
 * d'impression n'est pas un échec d'appel. `printProbe` rend un résultat
 * `ok: true` portant `printed: false` et sa raison. L'opération appelante — ici
 * l'écriture en base — n'est jamais annulée parce que le papier manque.
 */
import { openEncryptedDatabase, type EncryptedDatabase } from './database/database';
import { resolveEncryptionKey } from './database/encryption-key';
import {
  InvalidEncryptionKeyError,
  UnencryptedDatabaseError,
} from './database/database';
import { createReceiptPrinter } from './printing/printer-factory';
import { composeProbeReceipt } from './printing/receipt';
import { printSafely, type ReceiptPrinter } from './printing/receipt-printer';
import { IpcBackendError, type IpcBackend } from './ipc';
import type {
  OpenDatabaseResponse,
  PrintProbeRequest,
  PrintProbeResponse,
  PrintTarget,
  WriteProbeRequest,
  WriteProbeResponse,
} from '../shared/ipc-contract';

export interface ProbeApplicationOptions {
  readonly databasePath: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly now?: () => number;
  readonly createPrinter?: (target: PrintTarget) => ReceiptPrinter;
  readonly openDatabase?: typeof openEncryptedDatabase;
  readonly printTimeoutMs?: number;
}

export class ProbeApplication implements IpcBackend {
  readonly #options: ProbeApplicationOptions;
  readonly #now: () => number;
  #database: EncryptedDatabase | undefined;

  constructor(options: ProbeApplicationOptions) {
    this.#options = options;
    this.#now = options.now ?? ((): number => Date.now());
  }

  get database(): EncryptedDatabase | undefined {
    return this.#database;
  }

  openDatabase(): Promise<OpenDatabaseResponse> {
    try {
      if (this.#database === undefined || this.#database.isClosed) {
        const env = this.#options.env ?? process.env;
        const resolved = resolveEncryptionKey(env);
        const open = this.#options.openDatabase ?? openEncryptedDatabase;
        this.#database = open({
          filePath: this.#options.databasePath,
          encryptionKey: resolved.key,
          now: this.#now,
        });
      }
      return Promise.resolve({
        path: this.#database.filePath,
        encrypted: true,
        journalMode: this.#database.journalMode,
        schemaVersion: this.#database.schemaVersion,
      });
    } catch (error) {
      if (error instanceof UnencryptedDatabaseError || error instanceof InvalidEncryptionKeyError) {
        return Promise.reject(new IpcBackendError('DATABASE_UNAVAILABLE', error.message));
      }
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_FAILED',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  writeProbe(request: WriteProbeRequest): Promise<WriteProbeResponse> {
    const database = this.#database;
    if (database === undefined || database.isClosed) {
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_UNAVAILABLE',
          "La base n'est pas ouverte. Ouvrez-la avant d'écrire.",
        ),
      );
    }
    try {
      const entry = database.insertProbeEntry(request.label);
      return Promise.resolve({
        id: entry.id,
        label: entry.label,
        recordedAt: entry.recordedAt,
        total: database.countProbeEntries(),
      });
    } catch (error) {
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_FAILED',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async printProbe(request: PrintProbeRequest): Promise<PrintProbeResponse> {
    const composed = composeProbeReceipt({
      label: request.label,
      amountFcfa: request.amountFcfa,
      printedAt: new Date(this.#now()),
    });
    const factory = this.#options.createPrinter ?? createReceiptPrinter;
    const printer = factory(request.target);

    const outcome = await printSafely(
      printer,
      { bytes: composed.bytes, preview: composed.preview },
      this.#options.printTimeoutMs === undefined
        ? {}
        : { timeoutMs: this.#options.printTimeoutMs },
    );

    return {
      printed: outcome.printed,
      via: request.target,
      byteCount: outcome.byteCount,
      reason: outcome.printed ? null : outcome.reason,
      preview: composed.preview,
    };
  }

  close(): void {
    this.#database?.close();
    this.#database = undefined;
  }
}

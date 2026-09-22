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
import {
  CatalogService,
  TransactionalWriter,
  ValidationError,
  seedDemoDatabase,
} from '@tenu/db';
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
  CatalogGetProductRequest,
  CatalogGetProductResponse,
  CatalogSaveProductRequest,
  CatalogSaveProductResponse,
  CatalogSearchRequest,
  CatalogSearchResponse,
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
  #demoSession:
    | {
        tenantId: string;
        proprietaireId: string;
        gerantId: string;
        vendeurId: string;
      }
    | null = null;

  constructor(options: ProbeApplicationOptions) {
    this.#options = options;
    this.#now = options.now ?? ((): number => Date.now());
  }

  get database(): EncryptedDatabase | undefined {
    return this.#database;
  }

  #resolveDemoSession(database: EncryptedDatabase): {
    tenantId: string;
    proprietaireId: string;
    gerantId: string;
    vendeurId: string;
  } | null {
    if (this.#demoSession !== null) return this.#demoSession;
    const tenant = database.connection
      .prepare<[], { id: string }>('SELECT id FROM tenants ORDER BY created_at LIMIT 1')
      .get();
    if (tenant === undefined) return null;
    const users = database.connection
      .prepare<[string], { id: string; role: string }>(
        'SELECT id, role FROM users WHERE tenant_id = ?',
      )
      .all(tenant.id);
    const proprietaireId = users.find((user) => user.role === 'proprietaire')?.id;
    const gerantId = users.find((user) => user.role === 'gerant')?.id;
    const vendeurId = users.find((user) => user.role === 'vendeur')?.id;
    if (
      proprietaireId === undefined ||
      gerantId === undefined ||
      vendeurId === undefined
    ) {
      return null;
    }
    this.#demoSession = {
      tenantId: tenant.id,
      proprietaireId,
      gerantId,
      vendeurId,
    };
    return this.#demoSession;
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
      const database = this.#database;
      let demoSession: OpenDatabaseResponse['demoSession'] = null;
      try {
        const tenantRow = database.connection
          .prepare<[], { id: string }>('SELECT id FROM tenants LIMIT 1')
          .get();
        if (tenantRow === undefined) {
          const seeded = seedDemoDatabase(database);
          this.#demoSession = {
            tenantId: seeded.tenantId,
            proprietaireId: seeded.userIds.proprietaire,
            gerantId: seeded.userIds.gerant,
            vendeurId: seeded.userIds.vendeur,
          };
        }
        demoSession = this.#resolveDemoSession(database);
      } catch {
        demoSession = this.#demoSession;
      }
      return Promise.resolve({
        path: database.filePath,
        encrypted: true,
        journalMode: database.journalMode,
        schemaVersion: database.schemaVersion,
        demoSession,
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

  #requireCatalog(): CatalogService {
    const database = this.#database;
    if (database === undefined || database.isClosed) {
      throw new IpcBackendError(
        'DATABASE_UNAVAILABLE',
        "La base n'est pas ouverte. Ouvrez-la avant le catalogue.",
      );
    }
    return new CatalogService(database, new TransactionalWriter(database));
  }

  catalogSearch(request: CatalogSearchRequest): Promise<CatalogSearchResponse> {
    try {
      const catalog = this.#requireCatalog();
      const items = catalog.searchProducts(
        request.session.tenantId,
        request.query,
        request.limit,
        request.session.role,
      );
      return Promise.resolve({ items: [...items] });
    } catch (error) {
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_FAILED',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  catalogGetProduct(request: CatalogGetProductRequest): Promise<CatalogGetProductResponse> {
    try {
      const catalog = this.#requireCatalog();
      const product = catalog.getProduct(
        request.session.tenantId,
        request.productId,
        request.session.role,
      );
      if (product === null) {
        return Promise.resolve({ product: null });
      }
      const view = {
        id: product.id,
        internalCode: product.internalCode,
        name: product.name,
        barcode: product.barcode,
        altNames: [...product.altNames],
        categoryId: product.categoryId,
        baseUnit: product.baseUnit,
        referencePrice: product.referencePrice,
        floorPrice: product.floorPrice,
        stockAlertThreshold: product.stockAlertThreshold,
        location: product.location,
        active: product.active,
      };
      if ('averagePurchaseCost' in product) {
        return Promise.resolve({
          product: { ...view, averagePurchaseCost: product.averagePurchaseCost },
        });
      }
      return Promise.resolve({ product: view });
    } catch (error) {
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_FAILED',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  catalogSaveProduct(request: CatalogSaveProductRequest): Promise<CatalogSaveProductResponse> {
    if (request.session.role === 'vendeur') {
      return Promise.reject(
        new IpcBackendError('FORBIDDEN_ROLE', 'Le vendeur ne peut pas enregistrer une fiche [BR3.17]'),
      );
    }
    try {
      const catalog = this.#requireCatalog();
      const { fields } = request;
      const result = catalog.saveProduct(
        {
          tenantId: request.session.tenantId,
          actorUserId: request.session.actorUserId,
          deviceId: request.session.deviceId,
        },
        request.mode,
        {
          designation: fields.designation,
          baseUnit: fields.baseUnit,
          referencePrice: fields.referencePrice,
          floorPrice: fields.floorPrice,
          internalCode: fields.internalCode,
          barcode: fields.barcode,
          altNames: fields.altNames,
          categoryId: fields.categoryId,
          location: fields.location,
          averagePurchaseCost: fields.averagePurchaseCost,
          stockAlertThreshold: fields.stockAlertThreshold,
          productId: fields.productId,
        },
      );
      return Promise.resolve(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Promise.reject(new IpcBackendError('VALIDATION_FAILED', error.message));
      }
      if (error instanceof IpcBackendError) return Promise.reject(error);
      return Promise.reject(
        new IpcBackendError(
          'DATABASE_FAILED',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  close(): void {
    this.#database?.close();
    this.#database = undefined;
  }
}

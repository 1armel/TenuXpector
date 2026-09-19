/**
 * Interface d'impression et garantie de non-blocage (étape 12 du plan U1).
 *
 * Une imprimante thermique est un périphérique qui tombe : plus de papier,
 * câble débranché, file bloquée, coupure en cours d'impression. La règle du
 * projet est donc qu'**une impression échouée ne bloque jamais l'opération
 * appelante**. Elle est tenue ici, à un seul endroit, par `printSafely` — pas
 * dispersée dans chaque appelant, où elle finirait par manquer quelque part.
 *
 * Trois implémentations partagent cette interface (voir `docs/adr/`), parce que
 * la voie qui fonctionnera sous Windows n'est pas connue d'avance : c'est
 * précisément ce que cette preuve de concept doit trancher sur mesure.
 */
import type { PrintTarget } from '../../shared/ipc-contract';

export interface PrintJob {
  readonly bytes: Uint8Array;
  readonly preview: string;
}

export type PrintFailureCode =
  | 'PRINTER_UNAVAILABLE'
  | 'PRINTER_REFUSED'
  | 'PRINT_INTERRUPTED'
  | 'PRINT_TIMEOUT';

export interface PrintSucceeded {
  readonly printed: true;
  readonly target: PrintTarget;
  readonly byteCount: number;
}

export interface PrintFailed {
  readonly printed: false;
  readonly target: PrintTarget;
  readonly byteCount: number;
  readonly code: PrintFailureCode;
  readonly reason: string;
}

export type PrintOutcome = PrintSucceeded | PrintFailed;

export interface ReceiptPrinter {
  readonly target: PrintTarget;
  /** Libellé destiné au diagnostic, jamais à l'utilisateur final. */
  readonly description: string;
  isAvailable(): Promise<boolean>;
  /**
   * Peut lever ou rester bloquée : c'est `printSafely` qui absorbe les deux.
   * Une implémentation n'a donc pas à être défensive, seulement honnête.
   */
  print(job: PrintJob): Promise<void>;
}

/** Erreur qu'une implémentation lève pour signaler un refus identifiable. */
export class PrinterError extends Error {
  constructor(
    readonly code: PrintFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'PrinterError';
  }
}

export const DEFAULT_PRINT_TIMEOUT_MS = 10_000;

export interface PrintSafelyOptions {
  readonly timeoutMs?: number;
}

/**
 * Exécute une impression sans jamais rejeter ni rester bloquée.
 *
 * Quatre issues, toutes rendues sous forme de résultat :
 *   - l'imprimante se déclare absente ;
 *   - elle lève (refus, coupure, périphérique disparu) ;
 *   - elle ne rend jamais la main — le délai de garde tranche ;
 *   - elle imprime.
 *
 * Cette fonction ne relaie jamais l'exception à l'appelant. C'est la règle que
 * `printer.spec.ts` vérifie, et c'est la seule raison d'être de ce module.
 */
export async function printSafely(
  printer: ReceiptPrinter,
  job: PrintJob,
  options: PrintSafelyOptions = {},
): Promise<PrintOutcome> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;
  const byteCount = job.bytes.length;

  let available: boolean;
  try {
    available = await printer.isAvailable();
  } catch (error) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: 'PRINTER_UNAVAILABLE',
      reason: messageOf(error),
    };
  }

  if (!available) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: 'PRINTER_UNAVAILABLE',
      reason: `Imprimante indisponible : ${printer.description}`,
    };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const guard = new Promise<PrintOutcome>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        printed: false,
        target: printer.target,
        byteCount,
        code: 'PRINT_TIMEOUT',
        reason: `Aucune réponse de l'imprimante après ${String(timeoutMs)} ms`,
      });
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();
  });

  const attempt = (async (): Promise<PrintOutcome> => {
    try {
      await printer.print(job);
      return { printed: true, target: printer.target, byteCount };
    } catch (error) {
      return {
        printed: false,
        target: printer.target,
        byteCount,
        code: error instanceof PrinterError ? error.code : 'PRINTER_REFUSED',
        reason: messageOf(error),
      };
    }
  })();

  try {
    return await Promise.race([attempt, guard]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur inconnue';
}

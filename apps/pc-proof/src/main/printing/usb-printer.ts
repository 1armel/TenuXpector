/**
 * Envoi direct au périphérique USB — première des deux voies matérielles.
 *
 * Sous Windows, une imprimante thermique installée en port USB virtuel est
 * accessible comme un fichier : `\\.\USB001`, `COM3`, ou un port redirigé. On
 * y écrit les octets ESC/POS bruts, sans pilote, sans file d'attente. C'est la
 * voie la plus courte — et la plus fragile, car elle dépend du port exact.
 *
 * Le système de fichiers est **injecté**. Sans cela, il faudrait une imprimante
 * branchée pour exécuter le moindre test, ce que `unit-test-instructions.md`
 * interdit explicitement pour la suite automatisée.
 */
import { existsSync, writeFileSync } from 'node:fs';
import type { PrintTarget } from '../../shared/ipc-contract';
import { PrinterError, type PrintJob, type ReceiptPrinter } from './receipt-printer';

export interface UsbDeviceAccess {
  /** Le périphérique répond-il ? */
  exists(devicePath: string): boolean;
  /** Écrit les octets bruts sur le périphérique. Peut lever. */
  write(devicePath: string, bytes: Uint8Array): void;
}

export const nodeUsbDeviceAccess: UsbDeviceAccess = {
  exists(devicePath) {
    // Un port Windows (`\\.\USB001`, `COM3`) n'est pas toujours visible via
    // `existsSync`. On le considère alors présent et on laisse l'écriture
    // trancher : mieux vaut un échec d'écriture explicite qu'un refus a priori.
    if (/^\\\\\.\\/.test(devicePath) || /^COM\d+$/i.test(devicePath)) return true;
    return existsSync(devicePath);
  },
  write(devicePath, bytes) {
    writeFileSync(devicePath, bytes);
  },
};

export interface UsbReceiptPrinterOptions {
  /** Par exemple `\\.\USB001` sous Windows, `/dev/usb/lp0` sous Linux. */
  readonly devicePath: string;
  readonly access?: UsbDeviceAccess;
}

export class UsbReceiptPrinter implements ReceiptPrinter {
  readonly target: PrintTarget = 'usb';
  readonly description: string;

  readonly #devicePath: string;
  readonly #access: UsbDeviceAccess;

  constructor(options: UsbReceiptPrinterOptions) {
    this.#devicePath = options.devicePath;
    this.#access = options.access ?? nodeUsbDeviceAccess;
    this.description = `Périphérique USB ${options.devicePath}`;
  }

  isAvailable(): Promise<boolean> {
    try {
      return Promise.resolve(this.#access.exists(this.#devicePath));
    } catch {
      return Promise.resolve(false);
    }
  }

  print(job: PrintJob): Promise<void> {
    try {
      this.#access.write(this.#devicePath, job.bytes);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Un périphérique qui disparaît en cours d'écriture n'est pas un refus :
      // c'est une coupure. La distinction porte jusque dans le journal.
      const interrupted = /EIO|ENXIO|ENODEV|EPIPE|EBUSY/.test(message);
      throw new PrinterError(
        interrupted ? 'PRINT_INTERRUPTED' : 'PRINTER_REFUSED',
        `Écriture sur ${this.#devicePath} impossible : ${message}`,
      );
    }
  }
}

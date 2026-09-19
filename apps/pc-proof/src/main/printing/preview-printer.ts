/**
 * Aperçu à l'écran — troisième implémentation de `ReceiptPrinter`.
 *
 * Toujours disponible, sans matériel. C'est l'implémentation par défaut des
 * tests, et le repli quand aucune imprimante n'est branchée : la caisse doit
 * pouvoir fonctionner même sans papier, quitte à montrer le ticket à l'écran.
 *
 * Elle conserve les travaux reçus pour que les tests et le parcours de bout en
 * bout puissent vérifier ce qui aurait été imprimé, octet pour octet.
 */
import type { PrintTarget } from '../../shared/ipc-contract';
import type { PrintJob, ReceiptPrinter } from './receipt-printer';

export class PreviewReceiptPrinter implements ReceiptPrinter {
  readonly target: PrintTarget = 'preview';
  readonly description = "Aperçu à l'écran (aucun matériel requis)";

  readonly #jobs: PrintJob[] = [];

  get jobs(): readonly PrintJob[] {
    return this.#jobs;
  }

  get lastPreview(): string | undefined {
    return this.#jobs.at(-1)?.preview;
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  print(job: PrintJob): Promise<void> {
    this.#jobs.push(job);
    return Promise.resolve();
  }

  clear(): void {
    this.#jobs.length = 0;
  }
}

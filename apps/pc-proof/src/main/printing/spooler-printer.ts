/**
 * Octets bruts à la file d'impression Windows — seconde voie matérielle.
 *
 * L'imprimante est installée normalement sous Windows, partagée localement, et
 * les octets ESC/POS lui sont envoyés **sans passer par le pilote graphique**
 * (`copy /b fichier \\localhost\PartageImprimante`). La file d'attente Windows
 * fait alors le travail : réessais, gestion du port, file partagée.
 *
 * Plus robuste que l'écriture directe sur le port, mais elle exige que
 * l'imprimante soit partagée sous un nom connu, et elle ajoute une latence.
 * Laquelle des deux voies gagne se décide sur mesure, avec le matériel réel —
 * c'est le rôle de cette unité, et le contenu de `docs/adr/`.
 *
 * Le lanceur de commande et le système de fichiers sont injectés : la suite
 * automatisée n'imprime jamais pour de vrai.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PrintTarget } from '../../shared/ipc-contract';
import { PrinterError, type PrintJob, type ReceiptPrinter } from './receipt-printer';

export interface SpoolerAccess {
  /** Dépose les octets dans un fichier temporaire et rend son chemin. */
  stageBytes(bytes: Uint8Array): string;
  /** Envoie le fichier tel quel à la file d'impression. Peut lever. */
  sendRaw(filePath: string, shareName: string): void;
  /** Nettoie le fichier temporaire ; ne doit jamais lever. */
  discard(filePath: string): void;
}

export const windowsSpoolerAccess: SpoolerAccess = {
  stageBytes(bytes) {
    const directory = mkdtempSync(join(tmpdir(), 'tenu-print-'));
    const filePath = join(directory, 'receipt.bin');
    writeFileSync(filePath, bytes);
    return filePath;
  },
  sendRaw(filePath, shareName) {
    // `copy /b` est la seule voie « octets bruts » disponible sans module
    // natif. Elle impose que l'imprimante soit partagée (ADR 002).
    execFileSync('cmd', ['/c', 'copy', '/b', filePath, shareName], { stdio: 'ignore' });
  },
  discard(filePath) {
    try {
      rmSync(filePath, { force: true });
    } catch {
      // Un fichier temporaire non supprimé n'est pas une raison d'échouer une
      // impression réussie. Le système s'en chargera.
    }
  },
};

export interface SpoolerReceiptPrinterOptions {
  /** Nom de partage, par exemple `\\\\localhost\\TICKET`. */
  readonly shareName: string;
  readonly access?: SpoolerAccess;
}

export class SpoolerReceiptPrinter implements ReceiptPrinter {
  readonly target: PrintTarget = 'spooler';
  readonly description: string;

  readonly #shareName: string;
  readonly #access: SpoolerAccess;

  constructor(options: SpoolerReceiptPrinterOptions) {
    this.#shareName = options.shareName;
    this.#access = options.access ?? windowsSpoolerAccess;
    this.description = `File d'impression Windows ${options.shareName}`;
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(this.#shareName.length > 0);
  }

  print(job: PrintJob): Promise<void> {
    let stagedPath: string | undefined;
    try {
      stagedPath = this.#access.stageBytes(job.bytes);
      this.#access.sendRaw(stagedPath, this.#shareName);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new PrinterError(
        'PRINTER_REFUSED',
        `La file d'impression ${this.#shareName} a refusé le travail : ${message}`,
      );
    } finally {
      if (stagedPath !== undefined) this.#access.discard(stagedPath);
    }
  }
}

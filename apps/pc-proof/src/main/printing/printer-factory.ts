/**
 * Choix de l'implémentation d'impression.
 *
 * Aucune voie n'est privilégiée dans le code : c'est la cible demandée qui
 * décide, et l'aperçu à l'écran sert de repli universel. Les chemins matériels
 * (port USB, nom de partage) viennent de l'environnement, jamais d'une
 * constante en dur — un poste ne partage pas son imprimante sous le même nom
 * qu'un autre.
 */
import type { PrintTarget } from '../../shared/ipc-contract';
import { PreviewReceiptPrinter } from './preview-printer';
import type { ReceiptPrinter } from './receipt-printer';
import { SpoolerReceiptPrinter } from './spooler-printer';
import { UsbReceiptPrinter } from './usb-printer';

export const USB_DEVICE_ENV_VAR = 'TENU_PRINTER_DEVICE';
export const SPOOLER_SHARE_ENV_VAR = 'TENU_PRINTER_SHARE';

/** Port USB virtuel le plus courant pour une thermique installée sous Windows. */
export const DEFAULT_USB_DEVICE = '\\\\.\\USB001';
/** Nom de partage local attendu ; à ajuster poste par poste. */
export const DEFAULT_SPOOLER_SHARE = '\\\\localhost\\TICKET';

export function createReceiptPrinter(
  target: PrintTarget,
  env: NodeJS.ProcessEnv = process.env,
): ReceiptPrinter {
  switch (target) {
    case 'usb':
      return new UsbReceiptPrinter({ devicePath: env[USB_DEVICE_ENV_VAR] ?? DEFAULT_USB_DEVICE });
    case 'spooler':
      return new SpoolerReceiptPrinter({
        shareName: env[SPOOLER_SHARE_ENV_VAR] ?? DEFAULT_SPOOLER_SHARE,
      });
    case 'preview':
      return new PreviewReceiptPrinter();
  }
}

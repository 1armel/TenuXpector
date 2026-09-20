/**
 * Tests d’impression (étape 14, NFR13, DEC-04).
 * L’imprimante est doublée ; l’échec ne remonte jamais en exception.
 */
import { describe, expect, it, vi } from 'vitest';
import { formatAmountFcfa, formatDate, formatDateTime } from '../src/shared/formatting';
import { ESCPOS_COMMANDS, encodeText } from '../src/main/printing/escpos';
import { composeProbeReceipt } from '../src/main/printing/receipt';
import {
  PrinterError,
  printSafely,
  type PrintJob,
  type ReceiptPrinter,
} from '../src/main/printing/receipt-printer';
import { PreviewReceiptPrinter } from '../src/main/printing/preview-printer';
import { UsbReceiptPrinter } from '../src/main/printing/usb-printer';
import { SpoolerReceiptPrinter } from '../src/main/printing/spooler-printer';
import { createReceiptPrinter } from '../src/main/printing/printer-factory';

const FIXED_INSTANT = new Date('2026-03-15T10:30:00.000Z');

function jobFrom(label = 'demo'): PrintJob {
  const composed = composeProbeReceipt({
    label,
    amountFcfa: 12_500,
    printedAt: FIXED_INSTANT,
  });
  return { bytes: composed.bytes, preview: composed.preview };
}

describe('formatage utilisateur [DEC-04][NFR7]', () => {
  it('formate 12500 en « 12 500 FCFA » avec séparateur de milliers', () => {
    expect(formatAmountFcfa(12_500)).toMatch(/12.+500.+FCFA/);
    expect(formatAmountFcfa(12_500)).not.toContain('.');
  });

  it('refuse un montant non entier', () => {
    expect(() => formatAmountFcfa(12.5)).toThrow(RangeError);
  });

  it('affiche la date et l’heure à Africa/Douala (UTC+1)', () => {
    // 10:30 UTC → 11:30 Douala (pas d’heure d’été).
    expect(formatDate(FIXED_INSTANT)).toBe('15/03/2026');
    expect(formatDateTime(FIXED_INSTANT)).toBe('15/03/2026 11:30:00');
  });
});

describe('composition ESC/POS [NFR13]', () => {
  it('produit les octets d’initialisation et de coupe', () => {
    const composed = composeProbeReceipt({
      label: 'essai',
      amountFcfa: 12_500,
      printedAt: FIXED_INSTANT,
    });
    expect(composed.bytes[0]).toBe(ESCPOS_COMMANDS.initialize[0]);
    expect(composed.preview).toContain("TICKET D'ESSAI");
    expect(composed.preview).toMatch(/12.+500.+FCFA/);
    expect(composed.preview).toContain('15/03/2026');
  });

  it('encode les accents Windows-1252 et replie l’espace fine', () => {
    const bytes = encodeText('café test');
    expect(bytes).toContain(0xe9); // é
    expect(Array.from(bytes)).toContain(0x20); // repli espace
  });

  it('l’aperçu écran produit la même composition que les octets de texte', () => {
    const composed = composeProbeReceipt({
      label: 'meme',
      amountFcfa: 1000,
      printedAt: FIXED_INSTANT,
      entryId: 'ref-1',
    });
    const preview = new PreviewReceiptPrinter();
    void preview.print({ bytes: composed.bytes, preview: composed.preview });
    expect(preview.lastPreview).toBe(composed.preview);
    expect(preview.lastPreview).toContain('Reference');
  });
});

describe('printSafely — échec non bloquant [NFR13]', () => {
  it('réussit quand l’imprimante imprime', async () => {
    const printer = new PreviewReceiptPrinter();
    const outcome = await printSafely(printer, jobFrom());
    expect(outcome.printed).toBe(true);
    if (outcome.printed) expect(outcome.byteCount).toBeGreaterThan(0);
  });

  it('rend printed:false si l’imprimante est absente, sans lever', async () => {
    const printer: ReceiptPrinter = {
      target: 'usb',
      description: 'absente',
      isAvailable: async () => false,
      print: async () => {
        throw new Error('ne doit pas être appelée');
      },
    };
    await expect(printSafely(printer, jobFrom())).resolves.toMatchObject({
      printed: false,
      code: 'PRINTER_UNAVAILABLE',
    });
  });

  it('absorbe un refus d’imprimante', async () => {
    const printer: ReceiptPrinter = {
      target: 'usb',
      description: 'refuse',
      isAvailable: async () => true,
      print: async () => {
        throw new PrinterError('PRINTER_REFUSED', 'papier manquant');
      },
    };
    const outcome = await printSafely(printer, jobFrom());
    expect(outcome).toMatchObject({ printed: false, code: 'PRINTER_REFUSED' });
  });

  it('signale une coupure en cours d’impression', async () => {
    const printer: ReceiptPrinter = {
      target: 'usb',
      description: 'coupure',
      isAvailable: async () => true,
      print: async () => {
        throw new PrinterError('PRINT_INTERRUPTED', 'EIO device gone');
      },
    };
    const outcome = await printSafely(printer, jobFrom());
    expect(outcome).toMatchObject({ printed: false, code: 'PRINT_INTERRUPTED' });
  });

  it('tranche par délai de garde si l’imprimante ne répond pas', async () => {
    const printer: ReceiptPrinter = {
      target: 'spooler',
      description: 'hang',
      isAvailable: async () => true,
      print: async () =>
        await new Promise(() => {
          /* never resolves */
        }),
    };
    const outcome = await printSafely(printer, jobFrom(), { timeoutMs: 30 });
    expect(outcome).toMatchObject({ printed: false, code: 'PRINT_TIMEOUT' });
  });

  it('isAvailable qui lève devient PRINTER_UNAVAILABLE', async () => {
    const printer: ReceiptPrinter = {
      target: 'usb',
      description: 'boom',
      isAvailable: async () => {
        throw new Error('probe failed');
      },
      print: async () => undefined,
    };
    const outcome = await printSafely(printer, jobFrom());
    expect(outcome).toMatchObject({ printed: false, code: 'PRINTER_UNAVAILABLE' });
  });
});

describe('implémentations USB / spooler / factory', () => {
  it('USB écrit via l’accès injecté', async () => {
    const writes: Uint8Array[] = [];
    const printer = new UsbReceiptPrinter({
      devicePath: '/dev/null-tenu',
      access: {
        exists: () => true,
        write: (_path, bytes) => {
          writes.push(bytes);
        },
      },
    });
    await expect(printer.print(jobFrom())).resolves.toBeUndefined();
    expect(writes).toHaveLength(1);
  });

  it('USB signale une coupure sur ENODEV', async () => {
    const printer = new UsbReceiptPrinter({
      devicePath: '/dev/gone',
      access: {
        exists: () => true,
        write: () => {
          throw new Error('ENODEV');
        },
      },
    });
    try {
      await printer.print(jobFrom());
      expect.unreachable('print aurait dû lever');
    } catch (error) {
      expect(error).toBeInstanceOf(PrinterError);
      expect(error).toMatchObject({ code: 'PRINT_INTERRUPTED' });
    }
  });

  it('spooler envoie via l’accès injecté puis nettoie', async () => {
    const discarded: string[] = [];
    const printer = new SpoolerReceiptPrinter({
      shareName: '\\\\localhost\\TICKET',
      access: {
        stageBytes: () => '/tmp/staged.bin',
        sendRaw: vi.fn(),
        discard: (path) => {
          discarded.push(path);
        },
      },
    });
    await printer.print(jobFrom());
    expect(discarded).toEqual(['/tmp/staged.bin']);
  });

  it('spooler mappe un refus d’envoi', async () => {
    const printer = new SpoolerReceiptPrinter({
      shareName: '\\\\localhost\\TICKET',
      access: {
        stageBytes: () => '/tmp/staged.bin',
        sendRaw: () => {
          throw new Error('access denied');
        },
        discard: () => undefined,
      },
    });
    try {
      await printer.print(jobFrom());
      expect.unreachable('aurait dû lever');
    } catch (error) {
      expect(error).toBeInstanceOf(PrinterError);
      expect(error).toMatchObject({ code: 'PRINTER_REFUSED' });
    }
  });

  it('printSafely décrit une erreur non-Error', async () => {
    const printer: ReceiptPrinter = {
      target: 'usb',
      description: 'weird',
      isAvailable: async () => true,
      print: async () => {
        throw 42;
      },
    };
    const outcome = await printSafely(printer, jobFrom());
    expect(outcome).toMatchObject({ printed: false, reason: 'Erreur inconnue' });
  });

  it('createReceiptPrinter choisit la cible demandée', () => {
    expect(createReceiptPrinter('preview').target).toBe('preview');
    expect(createReceiptPrinter('usb', {}).target).toBe('usb');
    expect(createReceiptPrinter('spooler', {}).target).toBe('spooler');
  });
});

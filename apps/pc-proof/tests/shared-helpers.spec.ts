import { describe, expect, it } from 'vitest';
import { describeError, failure, isFailure, isSuccess, success } from '../src/shared/result';
import { formatAmountFcfa, toStoredTimestamp } from '../src/shared/formatting';
import { createReceiptPrinter } from '../src/main/printing/printer-factory';
import { nodeUsbDeviceAccess } from '../src/main/printing/usb-printer';

describe('result helpers', () => {
  it('discrimine succès et échec', () => {
    const ok = success(1);
    const ko = failure('X', 'nope');
    expect(isSuccess(ok)).toBe(true);
    expect(isFailure(ok)).toBe(false);
    expect(isSuccess(ko)).toBe(false);
    expect(isFailure(ko)).toBe(true);
  });

  it('describeError couvre Error, string et inconnu', () => {
    expect(describeError(new Error('e'))).toBe('e');
    expect(describeError('s')).toBe('s');
    expect(describeError(12)).toBe('Erreur inconnue');
  });
});

describe('formatting stockage', () => {
  it('stocke toujours en ISO UTC', () => {
    expect(toStoredTimestamp(new Date('2026-03-15T10:30:00.000Z'))).toBe(
      '2026-03-15T10:30:00.000Z',
    );
  });

  it('formate les montants négatifs et refuse les flottants', () => {
    expect(formatAmountFcfa(-12_500)).toMatch(/-/);
    expect(formatAmountFcfa(0)).toMatch(/0/);
    expect(() => formatAmountFcfa(1.5)).toThrow(RangeError);
  });
});

describe('printer factory / usb access', () => {
  it('considère les ports Windows comme présents', () => {
    expect(nodeUsbDeviceAccess.exists('\\\\.\\USB001')).toBe(true);
    expect(nodeUsbDeviceAccess.exists('COM3')).toBe(true);
  });

  it('crée les trois cibles', () => {
    expect(createReceiptPrinter('preview').description).toMatch(/Aperçu/);
    expect(createReceiptPrinter('usb', { TENU_PRINTER_DEVICE: '/tmp/lp0' }).description).toContain(
      '/tmp/lp0',
    );
    expect(
      createReceiptPrinter('spooler', { TENU_PRINTER_SHARE: '\\\\localhost\\X' }).description,
    ).toContain('\\\\localhost\\X');
  });
});

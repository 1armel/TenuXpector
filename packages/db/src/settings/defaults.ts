/**
 * Documented setting defaults and Zod schemas at the Settings boundary [BR3.1].
 */
import { z } from 'zod';

export const SETTING_KEYS = [
  'tva_rate_bps',
  'currency',
  'rounding_mode',
  'payment_modes',
  'receipt_mentions',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const tvaRateBpsSchema = z.number().int().min(0).max(100_00);
export const currencySchema = z.literal('FCFA');
export const roundingModeSchema = z.enum(['none', 'nearest_5', 'nearest_10']);
export const paymentModesSchema = z.array(z.enum(['cash', 'mobile_money', 'card'])).min(1);
export const receiptMentionsSchema = z.string().min(1);

export const settingValueSchemas = {
  tva_rate_bps: tvaRateBpsSchema,
  currency: currencySchema,
  rounding_mode: roundingModeSchema,
  payment_modes: paymentModesSchema,
  receipt_mentions: receiptMentionsSchema,
} as const;

export interface SettingValueMap {
  tva_rate_bps: z.infer<typeof tvaRateBpsSchema>;
  currency: z.infer<typeof currencySchema>;
  rounding_mode: z.infer<typeof roundingModeSchema>;
  payment_modes: z.infer<typeof paymentModesSchema>;
  receipt_mentions: z.infer<typeof receiptMentionsSchema>;
}

/**
 * Documented defaults applied when no tenant/store row exists.
 * These are the only hardcoded business values; runtime code reads Settings.
 */
export const DOCUMENTED_SETTING_DEFAULTS: SettingValueMap = {
  tva_rate_bps: 1925,
  currency: 'FCFA',
  rounding_mode: 'none',
  payment_modes: ['cash', 'mobile_money'],
  receipt_mentions: 'Merci de votre achat',
};

export function parseSettingValue<K extends SettingKey>(
  key: K,
  raw: unknown,
): SettingValueMap[K] {
  const schema = settingValueSchemas[key];
  return schema.parse(raw) as SettingValueMap[K];
}

/**
 * Settings service — typed read with store override → tenant → documented default [BR3.1, BR3.2].
 */
import type { EncryptedDatabase } from '../encrypted-database';
import { assertTenantMatch } from '../transactional-writer';
import { ValidationError } from '../types';
import {
  DOCUMENTED_SETTING_DEFAULTS,
  parseSettingValue,
  type SettingKey,
  type SettingValueMap,
} from './defaults';

interface SettingRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly store_id: string | null;
  readonly key: string;
  readonly value: string;
}

export class SettingsService {
  constructor(private readonly db: EncryptedDatabase) {}

  get<K extends SettingKey>(
    tenantId: string,
    key: K,
    storeId?: string,
  ): SettingValueMap[K] {
    if (storeId !== undefined) {
      const storeOverride = this.findRow(tenantId, key, storeId);
      if (storeOverride !== undefined) {
        assertTenantMatch(tenantId, storeOverride.tenant_id);
        return this.parseRow(key, storeOverride);
      }
    }

    const tenantRow = this.findRow(tenantId, key, null);
    if (tenantRow !== undefined) {
      assertTenantMatch(tenantId, tenantRow.tenant_id);
      return this.parseRow(key, tenantRow);
    }

    return DOCUMENTED_SETTING_DEFAULTS[key];
  }

  private findRow(
    tenantId: string,
    key: string,
    storeId: string | null,
  ): SettingRow | undefined {
    if (storeId === null) {
      return this.db.connection
        .prepare<
          [string, string],
          SettingRow
        >(
          `SELECT id, tenant_id, store_id, key, value FROM settings
           WHERE tenant_id = ? AND key = ? AND store_id IS NULL`,
        )
        .get(tenantId, key);
    }
    return this.db.connection
      .prepare<
        [string, string, string],
        SettingRow
      >(
        `SELECT id, tenant_id, store_id, key, value FROM settings
         WHERE tenant_id = ? AND key = ? AND store_id = ?`,
      )
      .get(tenantId, key, storeId);
  }

  private parseRow<K extends SettingKey>(key: K, row: SettingRow): SettingValueMap[K] {
    try {
      const parsed: unknown = JSON.parse(row.value);
      return parseSettingValue(key, parsed);
    } catch (cause) {
      throw new ValidationError(
        `Invalid setting value for ${key}: ${cause instanceof Error ? cause.message : 'parse error'} [BR3.1]`,
      );
    }
  }
}

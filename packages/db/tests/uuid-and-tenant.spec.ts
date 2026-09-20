/**
 * UUID v7 client-side [BR1.4] and tenant isolation smoke [BR1.5].
 */
import { afterEach, describe, expect, it } from 'vitest';
import { TenantIsolationError, assertTenantMatch, isUuidV7 } from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('UUID v7 [BR1.4]', () => {
  it('generates UUID v7 for probe and users', () => {
    const { db, proprietaireId } = createIdentityFixture();
    const probe = db.insertProbeEntry('id-check');
    expect(isUuidV7(probe.id)).toBe(true);
    expect(isUuidV7(proprietaireId)).toBe(true);
    db.close();
  });
});

describe('tenant isolation [BR1.5]', () => {
  it('assertTenantMatch throws on mismatch', () => {
    expect(() => assertTenantMatch('a', 'b')).toThrow(TenantIsolationError);
  });

  it('getUser does not return cross-tenant rows', () => {
    const { db, identity, vendeurId } = createIdentityFixture();
    const otherTenant = db.nextId();
    expect(identity.getUser(otherTenant, vendeurId)).toBeUndefined();
    db.close();
  });
});

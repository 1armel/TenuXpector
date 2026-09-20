/**
 * Identity PIN derivation, verify, lockout [BR2.1–BR2.2].
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  MIN_PIN_ITERATIONS,
  PIN_LOCKOUT_FAILURES,
  createPinMaterial,
  derivePinHash,
  verifyPinAgainstMaterial,
  ValidationError,
} from '../src/index';
import { cleanupTempDirs, createIdentityFixture } from './helpers';

afterEach(() => {
  cleanupTempDirs();
});

describe('PIN PBKDF2 [BR2.1]', () => {
  it('derives a deterministic hash for the same inputs', () => {
    const salt = Buffer.alloc(16, 7);
    const a = derivePinHash('1234', salt, MIN_PIN_ITERATIONS);
    const b = derivePinHash('1234', salt, MIN_PIN_ITERATIONS);
    expect(a.equals(b)).toBe(true);
  });

  it('rejects PIN that is not 4–6 digits', () => {
    expect(() => createPinMaterial('12')).toThrow(ValidationError);
    expect(() => createPinMaterial('abcdef')).toThrow(ValidationError);
  });

  it('rejects iterations below 310000', () => {
    const salt = Buffer.alloc(16, 1);
    expect(() => derivePinHash('1234', salt, 1000)).toThrow(ValidationError);
  });

  it('verifyPinAgainstMaterial succeeds and fails correctly', () => {
    const material = createPinMaterial('9876');
    expect(verifyPinAgainstMaterial('9876', material)).toBe(true);
    expect(verifyPinAgainstMaterial('0000', material)).toBe(false);
  });
});

describe('Identity.verifyPin [BR2.1 BR2.2]', () => {
  it('succeeds with the correct PIN and updates lastActivityAt', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const result = identity.verifyPin(tenantId, vendeurId, '3333', 'test-device');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lastActivityAt).not.toBeNull();
    }
    db.close();
  });

  it('fails with wrong PIN and appends a failed attempt', () => {
    const { db, identity, tenantId, vendeurId } = createIdentityFixture();
    const result = identity.verifyPin(tenantId, vendeurId, '9999', 'test-device');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('pin_invalid');
    expect(identity.countPinAttempts(tenantId, vendeurId)).toBe(1);
    db.close();
  });

  it('locks after 5 failures in 10 minutes', () => {
    let now = 1_700_000_000_000;
    const { db, identity, tenantId, vendeurId } = createIdentityFixture(() => now);
    for (let i = 0; i < PIN_LOCKOUT_FAILURES; i += 1) {
      const result = identity.verifyPin(tenantId, vendeurId, '0000', 'test-device');
      expect(result.ok).toBe(false);
    }
    const locked = identity.verifyPin(tenantId, vendeurId, '3333', 'test-device');
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toBe('pin_locked');

    now += 11 * 60 * 1000;
    const afterWindow = identity.verifyPin(tenantId, vendeurId, '3333', 'test-device');
    expect(afterWindow.ok).toBe(true);
    db.close();
  });

  it('returns user_not_found for unknown id', () => {
    const { db, identity, tenantId } = createIdentityFixture();
    const result = identity.verifyPin(
      tenantId,
      '01900000-0000-7000-8000-000000000099',
      '1111',
      'test-device',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('user_not_found');
    db.close();
  });
});

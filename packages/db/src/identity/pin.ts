/**
 * PIN derivation and verification — PBKDF2-SHA256, local only [BR2.1].
 */
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { MIN_PIN_ITERATIONS, ValidationError } from '../types';

const PIN_PATTERN = /^\d{4,6}$/;
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 32;

export interface PinMaterial {
  readonly pinHash: string;
  readonly pinSalt: string;
  readonly pinIterations: number;
}

export function assertValidPin(pin: string): void {
  if (!PIN_PATTERN.test(pin)) {
    throw new ValidationError('PIN must be 4 to 6 digits [BR2.1]');
  }
}

export function derivePinHash(
  pin: string,
  salt: Buffer,
  iterations: number = MIN_PIN_ITERATIONS,
): Buffer {
  assertValidPin(pin);
  if (iterations < MIN_PIN_ITERATIONS) {
    throw new ValidationError(`PIN iterations must be >= ${String(MIN_PIN_ITERATIONS)} [BR2.1]`);
  }
  return pbkdf2Sync(pin, salt, iterations, DERIVED_KEY_BYTES, 'sha256');
}

export function createPinMaterial(
  pin: string,
  iterations: number = MIN_PIN_ITERATIONS,
): PinMaterial {
  const salt = randomBytes(SALT_BYTES);
  const hash = derivePinHash(pin, salt, iterations);
  return {
    pinHash: hash.toString('hex'),
    pinSalt: salt.toString('hex'),
    pinIterations: iterations,
  };
}

export function verifyPinAgainstMaterial(pin: string, material: PinMaterial): boolean {
  assertValidPin(pin);
  const salt = Buffer.from(material.pinSalt, 'hex');
  const expected = Buffer.from(material.pinHash, 'hex');
  const actual = derivePinHash(pin, salt, material.pinIterations);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

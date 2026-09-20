/**
 * UUID version 7, generated client-side (CLAUDE.md, RFC 9562 §5.7).
 * No auto-increment: the device that creates the row decides the id.
 */

const MAX_TIMESTAMP_MS = 0xffff_ffff_ffff;
const COUNTER_MAX = 0x0fff;

export interface UuidV7Sources {
  now(): number;
  randomBytes(size: number): Uint8Array;
}

export interface UuidV7Generator {
  next(): string;
}

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

function format(bytes: Uint8Array): string {
  const hex = toHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function composeUuidV7(timestampMs: number, counter: number, randomTail: Uint8Array): string {
  if (!Number.isInteger(timestampMs) || timestampMs < 0 || timestampMs > MAX_TIMESTAMP_MS) {
    throw new RangeError(`Timestamp outside UUID v7 48-bit range: ${String(timestampMs)}`);
  }
  if (!Number.isInteger(counter) || counter < 0 || counter > COUNTER_MAX) {
    throw new RangeError(`Counter outside rand_a 12-bit range: ${String(counter)}`);
  }
  if (randomTail.length !== 8) {
    throw new RangeError(`Expected 8 random bytes, got ${String(randomTail.length)}`);
  }

  const bytes = new Uint8Array(16);
  bytes[0] = Math.floor(timestampMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestampMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestampMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestampMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestampMs / 2 ** 8) & 0xff;
  bytes[5] = timestampMs & 0xff;
  bytes[6] = 0x70 | ((counter >>> 8) & 0x0f);
  bytes[7] = counter & 0xff;
  bytes[8] = 0x80 | ((randomTail[0] ?? 0) & 0x3f);
  for (let index = 1; index < 8; index += 1) {
    bytes[8 + index] = randomTail[index] ?? 0;
  }
  return format(bytes);
}

export function createUuidV7Generator(sources: UuidV7Sources): UuidV7Generator {
  let lastTimestampMs = -1;
  let counter = 0;

  return {
    next(): string {
      let timestampMs = Math.floor(sources.now());
      if (timestampMs > lastTimestampMs) {
        lastTimestampMs = timestampMs;
        counter = 0;
      } else {
        timestampMs = lastTimestampMs;
        counter += 1;
        if (counter > COUNTER_MAX) {
          lastTimestampMs += 1;
          timestampMs = lastTimestampMs;
          counter = 0;
        }
      }
      return composeUuidV7(timestampMs, counter, sources.randomBytes(8));
    },
  };
}

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isUuidV7(candidate: string): boolean {
  return UUID_V7_PATTERN.test(candidate);
}

export function timestampOfUuidV7(uuid: string): number {
  if (!isUuidV7(uuid)) throw new RangeError(`Not a UUID v7: ${uuid}`);
  return Number.parseInt(uuid.slice(0, 8) + uuid.slice(9, 13), 16);
}

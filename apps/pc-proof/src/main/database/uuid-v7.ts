/**
 * UUID version 7, généré côté client (CLAUDE.md, RFC 9562 §5.7).
 *
 * Aucun auto-incrément n'existe dans ce projet : un identifiant est décidé par
 * le poste qui crée la ligne, jamais par la base. C'est ce qui permettra plus
 * tard à deux caisses hors ligne d'écrire sans se marcher dessus.
 *
 * La version 7 est triable dans l'ordre de création parce que ses 48 premiers
 * bits sont l'horodatage Unix en millisecondes. À l'intérieur d'une même
 * milliseconde, la monotonie est assurée par un compteur de 12 bits placé dans
 * `rand_a` (méthode 1 de la RFC) : deux identifiants créés dans la même
 * milliseconde restent strictement croissants.
 *
 * Aucune source d'aléa ni aucune horloge n'est lue directement ici : les deux
 * sont injectées, pour que les tests soient déterministes.
 */

const MAX_TIMESTAMP_MS = 0xffff_ffff_ffff; // 2^48 - 1
const COUNTER_MAX = 0x0fff; // 12 bits de `rand_a`

export interface UuidV7Sources {
  /** Horodatage Unix en millisecondes. */
  now(): number;
  /** Renvoie exactement `size` octets aléatoires. */
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

/**
 * Assemble un UUID v7 à partir d'un horodatage, d'un compteur et de 8 octets
 * aléatoires. Fonction pure : c'est elle qu'on éprouve.
 */
export function composeUuidV7(timestampMs: number, counter: number, randomTail: Uint8Array): string {
  if (!Number.isInteger(timestampMs) || timestampMs < 0 || timestampMs > MAX_TIMESTAMP_MS) {
    throw new RangeError(`Horodatage hors des 48 bits de l'UUID v7 : ${String(timestampMs)}`);
  }
  if (!Number.isInteger(counter) || counter < 0 || counter > COUNTER_MAX) {
    throw new RangeError(`Compteur hors des 12 bits de rand_a : ${String(counter)}`);
  }
  if (randomTail.length !== 8) {
    throw new RangeError(`8 octets aléatoires attendus, ${String(randomTail.length)} reçus`);
  }

  const bytes = new Uint8Array(16);
  // 48 bits d'horodatage, gros-boutiste.
  bytes[0] = Math.floor(timestampMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestampMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(timestampMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(timestampMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(timestampMs / 2 ** 8) & 0xff;
  bytes[5] = timestampMs & 0xff;
  // 4 bits de version (7) puis les 12 bits du compteur.
  bytes[6] = 0x70 | ((counter >>> 8) & 0x0f);
  bytes[7] = counter & 0xff;
  // 2 bits de variante (RFC 4122) puis 62 bits d'aléa.
  bytes[8] = 0x80 | ((randomTail[0] ?? 0) & 0x3f);
  for (let index = 1; index < 8; index += 1) {
    bytes[8 + index] = randomTail[index] ?? 0;
  }
  return format(bytes);
}

/**
 * Crée un générateur monotone. Le compteur repart de zéro à chaque nouvelle
 * milliseconde ; s'il sature dans la même milliseconde, l'horodatage est
 * avancé d'une milliseconde plutôt que de rendre deux identifiants égaux.
 */
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

/** Horodatage (ms) encodé dans un UUID v7. */
export function timestampOfUuidV7(uuid: string): number {
  if (!isUuidV7(uuid)) throw new RangeError(`Identifiant non conforme à l'UUID v7 : ${uuid}`);
  return Number.parseInt(uuid.slice(0, 8) + uuid.slice(9, 13), 16);
}

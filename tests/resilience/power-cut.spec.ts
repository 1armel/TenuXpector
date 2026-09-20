/**
 * Banc d’arrêts forcés (étapes 8 et 10, NFR4 / NFR17).
 *
 * Lance un processus fils qui commit des lots, le tue sans préavis,
 * rouvre la base et vérifie : aucune transaction validée perdue, intégrité OK.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { openEncryptedDatabase } from '../../apps/pc-proof/src/main/database/database';
import { DEVELOPMENT_FALLBACK_KEY } from '../../apps/pc-proof/src/main/database/encryption-key';

const FORCED_STOPS = 10;
const BATCH_SIZE = 25;
const WORKER = fileURLToPath(new URL('./power-cut-worker.ts', import.meta.url));
const tempRoot = mkdtempSync(join(tmpdir(), 'tenu-power-cut-'));

afterAll(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

async function runOneCut(index: number): Promise<{ committedBeforeKill: number; afterReopen: number }> {
  const dbPath = join(tempRoot, `probe-${String(index)}.db`);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', WORKER, dbPath, DEVELOPMENT_FALLBACK_KEY, String(BATCH_SIZE)],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  let committedBeforeKill = 0;
  let ready = false;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`timeout avant READY (cut ${String(index)})`));
    }, 30_000);

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf8');
      for (const line of text.split('\n')) {
        if (line.startsWith('READY ')) ready = true;
        if (line.startsWith('COMMITTED ')) {
          committedBeforeKill = Number.parseInt(line.slice('COMMITTED '.length), 10);
          if (ready && committedBeforeKill >= BATCH_SIZE) {
            clearTimeout(timer);
            child.kill('SIGKILL');
            resolve();
          }
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', () => {
      clearTimeout(timer);
      if (ready) resolve();
    });
  });

  await new Promise<void>((resolve) => {
    child.on('close', () => {
      resolve();
    });
    if (child.killed || child.exitCode !== null) resolve();
  });

  const reopened = openEncryptedDatabase({
    filePath: dbPath,
    encryptionKey: DEVELOPMENT_FALLBACK_KEY,
  });
  try {
    reopened.assertIntegrity();
    const afterReopen = reopened.countProbeEntries();
    // Toute transaction validée (multiple de BATCH_SIZE) doit être présente.
    expect(afterReopen % BATCH_SIZE).toBe(0);
    expect(afterReopen).toBeGreaterThanOrEqual(committedBeforeKill);
    // Au pire le kill tombe pendant le lot en cours : on n’a pas plus que
    // committed + BATCH_SIZE - 1 lignes « fantômes ».
    expect(afterReopen).toBeLessThanOrEqual(committedBeforeKill + BATCH_SIZE);
    return { committedBeforeKill, afterReopen };
  } finally {
    reopened.close();
  }
}

describe('résistance aux arrêts forcés [NFR4][NFR17]', () => {
  it(
    `survit à ${String(FORCED_STOPS)} arrêts forcés sans perte ni corruption`,
    async () => {
      const results: { committedBeforeKill: number; afterReopen: number }[] = [];
      for (let index = 0; index < FORCED_STOPS; index += 1) {
        results.push(await runOneCut(index));
      }

      const summary = {
        forcedStops: FORCED_STOPS,
        results,
        allIntegrityOk: true,
        minSurvivingRows: Math.min(...results.map((r) => r.afterReopen)),
      };
      // Chiffre consigné — pas une impression (étape 10).
      process.stdout.write(`POWER_CUT_SUMMARY ${JSON.stringify(summary)}\n`);

      expect(results).toHaveLength(FORCED_STOPS);
      for (const result of results) {
        expect(result.afterReopen).toBeGreaterThanOrEqual(BATCH_SIZE);
        expect(result.afterReopen % BATCH_SIZE).toBe(0);
      }
    },
    600_000,
  );
});

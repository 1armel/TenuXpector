/**
 * Worker du banc d’arrêts forcés (étape 8 / 10).
 * Écrit des lots transactionnels jusqu’à être tué par le parent.
 */
import { openEncryptedDatabase } from '../../apps/pc-proof/src/main/database/database';

const filePath = process.argv[2];
const encryptionKey = process.argv[3];
const batchSize = Number.parseInt(process.argv[4] ?? '20', 10);

if (filePath === undefined || encryptionKey === undefined) {
  process.stderr.write('usage: power-cut-worker <dbPath> <key> [batchSize]\n');
  process.exit(2);
}

const database = openEncryptedDatabase({ filePath, encryptionKey });
let batch = 0;

process.stdout.write(`READY ${String(database.countProbeEntries())}\n`);

try {
  for (;;) {
    batch += 1;
    database.insertProbeBatch(`cut-${String(batch)}`, batchSize);
    process.stdout.write(`COMMITTED ${String(database.countProbeEntries())}\n`);
  }
} finally {
  database.close();
}

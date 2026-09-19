#!/usr/bin/env node
/**
 * Installe les contrôles git versionnés (NFR18).
 *
 * Les hooks vivent dans `.githooks/`, sous contrôle de version, et git y est
 * pointé par `core.hooksPath`. Personne n'a donc à se souvenir de les copier :
 * `pnpm install` suffit. Hors dépôt git (installation depuis une archive, CI
 * sans historique), le script ne fait rien et ne casse pas l'installation.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(repoRoot, '.git'))) {
  console.log('[hooks] Pas de dépôt git ici — installation des hooks ignorée.');
  process.exit(0);
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  console.log('[hooks] core.hooksPath = .githooks');
} catch (error) {
  console.warn(`[hooks] Installation impossible : ${String(error)}`);
}

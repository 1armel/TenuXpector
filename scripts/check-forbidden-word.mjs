#!/usr/bin/env node
/**
 * Contrôle NFR14 / ENF-14 : le mot interdit ne doit apparaître dans aucun
 * fichier de code.
 *
 * Trois règles de conception, dictées par `team.md` :
 *
 * 1. **Liste d'inclusion**, pas liste d'exclusion : on ne contrôle que les
 *    chemins de code (`apps/`, `packages/`, configuration à la racine). Un
 *    nouveau dossier n'est donc jamais contrôlé par accident, et surtout la
 *    documentation et les exigences — qui emploient légitimement ce mot —
 *    ne sont jamais visées.
 * 2. **Le script ne contient pas le mot en clair.** Il le reconstruit depuis
 *    ses points de code. Sans cela, le script serait lui-même une violation.
 * 3. **Échec bruyant si le périmètre est vide.** Un contrôle qui ne regarde
 *    aucun fichier est un contrôle qui ment : il sort en erreur.
 *
 * Usage :
 *   node scripts/check-forbidden-word.mjs            # arbre complet
 *   node scripts/check-forbidden-word.mjs --staged   # fichiers indexés
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Points de code du mot interdit — jamais le mot lui-même dans ce fichier. */
const FORBIDDEN_CODE_POINTS = [113, 117, 105, 110, 99, 97, 105, 108, 108, 101, 114, 105, 101];
const FORBIDDEN = String.fromCharCode(...FORBIDDEN_CODE_POINTS);

/** Répertoires de code contrôlés, relatifs à la racine du dépôt. */
const INCLUDED_DIRS = ['apps', 'packages', 'scripts'];

/** Fichiers de configuration de la racine, contrôlés nommément. */
const INCLUDED_ROOT_FILES = [
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'eslint.config.js',
  'vitest.config.ts',
  'playwright.config.ts',
  '.prettierrc.json',
  '.editorconfig',
];

/**
 * Seule exclusion admise : le jeu de démonstration, désigné par son chemin
 * exact (et non par un motif). Il n'existe pas encore en U1 ; il arrivera
 * avec U2.
 */
const EXCLUDED_EXACT_PATHS = ['packages/db/src/seed/demo-seed.ts'];

/** Dossiers jamais parcourus : ils ne contiennent pas de code du projet. */
const SKIPPED_DIR_NAMES = new Set(['node_modules', 'dist', 'out', 'coverage', '.git']);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.html',
  '.css',
  '.sql',
]);

/** @param {string} filePath */
function hasTextExtension(filePath) {
  const dot = filePath.lastIndexOf('.');
  return dot !== -1 && TEXT_EXTENSIONS.has(filePath.slice(dot));
}

/** @param {string} absoluteDir @returns {string[]} chemins relatifs au dépôt */
function walk(absoluteDir) {
  /** @type {string[]} */
  const found = [];
  let entries;
  try {
    entries = readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIR_NAMES.has(entry.name)) continue;
      found.push(...walk(join(absoluteDir, entry.name)));
    } else if (entry.isFile()) {
      found.push(relative(REPO_ROOT, join(absoluteDir, entry.name)).split(sep).join('/'));
    }
  }
  return found;
}

/** @param {string} relativePath */
function isInScope(relativePath) {
  if (EXCLUDED_EXACT_PATHS.includes(relativePath)) return false;
  if (!hasTextExtension(relativePath)) return false;
  if (INCLUDED_ROOT_FILES.includes(relativePath)) return true;
  return INCLUDED_DIRS.some((dir) => relativePath.startsWith(`${dir}/`));
}

/** @returns {string[]} */
function stagedFiles() {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return output.split('\n').filter((line) => line.length > 0);
}

/** @returns {string[]} */
function everyTrackedFile() {
  const found = [...INCLUDED_ROOT_FILES];
  for (const dir of INCLUDED_DIRS) {
    found.push(...walk(join(REPO_ROOT, dir)));
  }
  return found;
}

function main() {
  const staged = process.argv.includes('--staged');
  const candidates = staged ? stagedFiles() : everyTrackedFile();
  const inScope = candidates.filter(isInScope).filter((path) => {
    try {
      return statSync(join(REPO_ROOT, path)).isFile();
    } catch {
      return false;
    }
  });

  if (!staged && inScope.length === 0) {
    console.error(
      '[ENF-14] ÉCHEC : le périmètre contrôlé est vide. ' +
        'Un contrôle qui ne lit aucun fichier ne prouve rien. ' +
        `Répertoires attendus : ${INCLUDED_DIRS.join(', ')}.`,
    );
    process.exit(2);
  }

  const needle = FORBIDDEN.toLowerCase();
  /** @type {{ path: string; line: number }[]} */
  const hits = [];
  for (const path of inScope) {
    const content = readFileSync(join(REPO_ROOT, path), 'utf8');
    if (!content.toLowerCase().includes(needle)) continue;
    content.split('\n').forEach((line, index) => {
      if (line.toLowerCase().includes(needle)) hits.push({ path, line: index + 1 });
    });
  }

  if (hits.length > 0) {
    console.error(`[ENF-14] ÉCHEC : mot interdit trouvé dans ${hits.length} ligne(s) :`);
    for (const hit of hits) console.error(`  ${hit.path}:${hit.line}`);
    console.error('Le mot est banni des fichiers de code. Utilisez un terme neutre.');
    process.exit(1);
  }

  console.log(`[ENF-14] OK — ${inScope.length} fichier(s) contrôlé(s), aucune occurrence.`);
}

main();

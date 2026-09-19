#!/usr/bin/env node
/**
 * Contrôle NFR8 / ENF-08 : aucun secret ne doit entrer dans le dépôt.
 *
 * Contrôle de premier rideau, volontairement simple et sans dépendance : il
 * cherche des motifs qui ne peuvent pratiquement pas être légitimes dans du
 * code source (en-têtes de clés privées, jetons de fournisseurs, affectations
 * de clés à une valeur longue). Il ne remplace pas une revue ; il empêche
 * l'accident le plus courant.
 *
 * Usage :
 *   node scripts/check-staged-secrets.mjs            # fichiers indexés
 *   node scripts/check-staged-secrets.mjs --all      # arbre de travail suivi
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Chemins jamais contrôlés : artefacts, dépendances, et ce script lui-même. */
const SKIPPED_PREFIXES = [
  'node_modules/',
  'dist/',
  'out/',
  'coverage/',
  'pnpm-lock.yaml',
  'scripts/check-staged-secrets.mjs',
];

const RULES = [
  { id: 'private-key', label: 'en-tête de clé privée', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'aws-access-key', label: "identifiant d'accès AWS", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'github-token', label: 'jeton GitHub', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { id: 'slack-token', label: 'jeton Slack', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  {
    id: 'assigned-secret',
    label: 'affectation de secret à une valeur littérale longue',
    // clé/mot de passe/jeton = "<32+ caractères sans espace>"
    pattern:
      /\b(?:secret|password|passwd|api[_-]?key|access[_-]?token|private[_-]?key|encryption[_-]?key)\b\s*[:=]\s*["'`][A-Za-z0-9+/=_-]{32,}["'`]/i,
  },
];

/** @returns {string[]} */
function targetFiles() {
  const all = process.argv.includes('--all');
  const args = all ? ['ls-files'] : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'];
  const output = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .filter((line) => !SKIPPED_PREFIXES.some((prefix) => line.startsWith(prefix)));
}

function main() {
  /** @type {{ path: string; line: number; label: string }[]} */
  const hits = [];
  for (const path of targetFiles()) {
    const absolute = join(REPO_ROOT, path);
    let content;
    try {
      if (!statSync(absolute).isFile()) continue;
      content = readFileSync(absolute, 'utf8');
    } catch {
      continue;
    }
    content.split('\n').forEach((line, index) => {
      for (const rule of RULES) {
        if (rule.pattern.test(line)) hits.push({ path, line: index + 1, label: rule.label });
      }
    });
  }

  if (hits.length > 0) {
    console.error(`[ENF-08] ÉCHEC : ${hits.length} secret(s) probable(s) :`);
    for (const hit of hits) console.error(`  ${hit.path}:${hit.line} — ${hit.label}`);
    console.error("Retirez le secret, régénérez-le, et passez par une variable d'environnement.");
    process.exit(1);
  }

  console.log('[ENF-08] OK — aucun secret détecté.');
}

main();

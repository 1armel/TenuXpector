import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * Banc de test unitaire et d'intégration (étape 3 du plan U1).
 *
 * Les seuils de couverture sont déclarés ici et **ne sont jamais abaissés**
 * pour faire passer une étape (team.md, `unit-test-instructions.md`).
 * Ils valent 80 % des lignes et des branches sur `apps/pc-proof`.
 *
 * `electron` est aliasé vers une doublure : le processus principal doit être
 * testable hors runtime Electron, sans quoi le durcissement — qui est le seul
 * sujet réellement non rattrapable de cette unité — ne serait jamais couvert
 * par un test automatique.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@pc-proof': fileURLToPath(new URL('./apps/pc-proof/src', import.meta.url)),
      electron: fileURLToPath(new URL('./apps/pc-proof/tests/doubles/electron.ts', import.meta.url)),
    },
  },
  test: {
    root,
    environment: 'node',
    include: [
      'apps/**/tests/**/*.spec.ts',
      'apps/**/tests/**/*.spec.tsx',
      'packages/**/tests/**/*.spec.ts',
      'tests/tooling/**/*.spec.ts',
      'tests/resilience/**/*.spec.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', 'tests/e2e/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['apps/pc-proof/src/**/*.ts', 'apps/pc-proof/src/**/*.tsx'],
      // Exclusions explicites, et aucune autre (unit-test-instructions.md) :
      // fichiers de types, fichiers générés, migrations, jeu de démonstration.
      exclude: ['**/*.d.ts', '**/generated/**', '**/seed/**'],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});

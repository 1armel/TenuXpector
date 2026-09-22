import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * Banc de test unitaire et d'intégration.
 *
 * Couverture par défaut = `@tenu/db` (commande U2 :
 * `vitest --dir packages/db --coverage`).
 * U1 pc-proof surcharge `coverage.include` via le script `test:unit`.
 * Seuils 80 % jamais abaissés ; exclusions : types, migrations, seed.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@pc-proof': fileURLToPath(new URL('./apps/pc-proof/src', import.meta.url)),
      '@tenu/db': fileURLToPath(new URL('./packages/db/src/index.ts', import.meta.url)),
      '@tenu/domain': fileURLToPath(new URL('./packages/domain/src/index.ts', import.meta.url)),
      electron: fileURLToPath(new URL('./apps/pc-proof/tests/doubles/electron.ts', import.meta.url)),
    },
  },
  test: {
    root,
    environment: 'node',
    include: [
      'apps/**/tests/**/*.spec.ts',
      'apps/**/tests/**/*.spec.tsx',
      'apps/**/src/**/*.spec.ts',
      'apps/**/src/**/*.spec.tsx',
      'packages/**/tests/**/*.spec.ts',
      'packages/**/src/**/*.spec.ts',
      'tests/tooling/**/*.spec.ts',
      'tests/resilience/**/*.spec.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', 'tests/e2e/**', '**/doubles/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['packages/db/src/**/*.ts', 'src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/generated/**',
        '**/migrations.ts',
        '**/seed/**',
        '**/doubles/**',
        '**/index.ts',
        '**/tests/**',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
  },
});

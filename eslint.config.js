// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Configuration ESLint de TenuXpector.
 *
 * Deux exigences la structurent :
 *   - NFR11 : TypeScript strict, aucun `any` — les règles typées de
 *     `typescript-eslint` sont donc activées, pas seulement les syntaxiques.
 *   - Frontière de couches (team.md, Code Style) : `packages/domain` ne doit
 *     dépendre ni d'une base, ni d'un framework d'interface, ni du réseau.
 *     La règle est posée **maintenant**, alors que le paquet est encore vide,
 *     pour qu'aucune première violation n'ait à être défaite plus tard.
 */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/coverage/**',
      'aidlc/**',
      'docs/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Les scripts d'outillage sont du JavaScript Node annoté en JSDoc.
  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Frontière de couches : `packages/domain` reste pur.
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'domain reste pur : aucune dépendance à une interface.' },
            { name: 'react-dom', message: 'domain reste pur : aucune dépendance à une interface.' },
            { name: 'electron', message: 'domain reste pur : aucune dépendance à Electron.' },
            {
              name: 'better-sqlite3-multiple-ciphers',
              message: 'domain reste pur : aucune dépendance à une base.',
            },
          ],
          patterns: [
            {
              group: ['node:fs', 'node:fs/*', 'fs', 'fs/*'],
              message: 'domain reste pur : aucun accès au système de fichiers.',
            },
            {
              group: ['node:http', 'node:https', 'node:net', 'http', 'https', 'net', 'undici'],
              message: 'domain reste pur : aucun accès au réseau.',
            },
            {
              group: ['**/main/**', '**/renderer/**', '**/preload/**', '@tenu/pc-proof', '@tenu/pc-proof/*'],
              message: 'domain reste pur : aucune dépendance à un adaptateur.',
            },
          ],
        },
      ],
    },
  },

  // Le processus principal et le préchargement tournent sous Node.
  {
    files: ['apps/*/src/main/**/*.ts', 'apps/*/src/preload/**/*.ts', 'scripts/**/*', 'tests/**/*'],
    languageOptions: { globals: { ...globals.node } },
  },

  // L'interface tourne dans le rendu, sans Node.
  {
    files: ['apps/*/src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'electron', 'better-sqlite3-multiple-ciphers'],
              message:
                "L'interface n'a aucun accès à Node : tout passe par le pont IPC validé (NFR8).",
            },
          ],
        },
      ],
    },
  },

  {
    rules: {
      // NFR11 — aucun `any`, sous aucune forme.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // Un refus métier attendu est un résultat typé ; une erreur avalée, jamais.
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },

  prettier,
);

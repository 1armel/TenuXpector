import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'node:path';

/**
 * Build Electron pour U1 (étape 5).
 * Trois cibles : processus principal, préchargement, rendu React via Vite.
 */
export default defineConfig({
  main: {
    // electron-vite 5 marque le plugin comme déprécié ; l’option de remplacement
    // n’est pas encore stable dans notre version — on conserve le plugin.
    // @tenu/db exporte du .ts source : l’externaliser casse Node ESM
    // (imports relatifs sans extension). On le bundle dans le main.
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- voir ADR 003
    plugins: [externalizeDepsPlugin({ exclude: ['@tenu/db'] })],
    build: {
      lib: {
        entry: resolve('src/main/main.ts'),
      },
      outDir: 'out/main',
      rollupOptions: {
        output: {
          entryFileNames: 'main.cjs',
          format: 'cjs',
        },
      },
    },
  },
  preload: {
    // Sandboxed preload cannot `require()` arbitrary node_modules. Bundle Zod
    // into the preload script so `window.tenu` is exposed (contextBridge).
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- voir ADR 003
    plugins: [externalizeDepsPlugin({ exclude: ['zod'] })],
    build: {
      lib: {
        entry: resolve('src/preload/preload.ts'),
      },
      outDir: 'out/preload',
      rollupOptions: {
        output: {
          entryFileNames: 'preload.cjs',
          format: 'cjs',
        },
      },
    },
  },
  renderer: {
    root: resolve('src/renderer'),
    build: {
      outDir: resolve('out/renderer'),
      rollupOptions: {
        input: resolve('src/renderer/index.html'),
      },
    },
  },
});

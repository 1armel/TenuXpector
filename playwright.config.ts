import { defineConfig } from '@playwright/test';

/**
 * Bout en bout sur Electron (étape 15 du plan U1).
 *
 * Playwright pilote l'application empaquetée par `electron-vite build`. Le
 * parcours reste minuscule — démarrer, ouvrir la base, écrire, imprimer,
 * fermer — parce que c'est le squelette qui grandira jusqu'au parcours complet
 * exigé par NFR11, et le point de départ de la parité PC / tablette (NFR15).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
});

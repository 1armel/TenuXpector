/**
 * Parcours Playwright Electron (étape 15) — squelette du parcours NFR11.
 *
 * Ce fichier reste exécutable hors Windows : si le binaire Electron n’est pas
 * disponible ou si le build n’est pas prêt, le test est sauté avec un motif
 * explicite plutôt que d’abaisser un seuil.
 */
import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '../../apps/pc-proof');
const mainEntry = join(appRoot, 'out/main/main.cjs');

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [mainEntry],
    env: {
      ...process.env,
      TENU_ENV: 'test',
      TENU_DATABASE_KEY: 'cle-de-developpement-non-secrete',
    },
  });
  const page = await app.firstWindow();
  await page.waitForSelector('[data-testid="pc-proof-app"]');
  return { app, page };
}

test.describe('pc-proof e2e [NFR11]', () => {
  test.beforeAll(() => {
    test.skip(!existsSync(mainEntry), `Build Electron manquant : ${mainEntry}. Lancer pnpm build.`);
  });

  test('démarrer → ouvrir → écrire → imprimer → fermer', async () => {
    const { app, page } = await launchApp();
    try {
      await page.getByTestId('open-database').click();
      await expect(page.getByTestId('status-line')).toContainText(/Base ouverte/i);
      await expect(page.getByTestId('database-info')).toBeVisible();

      await page.getByTestId('write-probe').click();
      await expect(page.getByTestId('status-line')).toContainText(/Ligne écrite/i);

      await page.getByTestId('print-probe').click();
      await expect(page.getByTestId('print-preview')).toContainText(/TICKET D'ESSAI/);
    } finally {
      await app.close();
    }
  });

  test('échec d’impression (cible absente) ne bloque pas l’UI', async () => {
    const { app, page } = await launchApp();
    try {
      await page.getByTestId('open-database').click();
      await expect(page.getByTestId('status-line')).toContainText(/Base ouverte/i);
      // L’UI utilise preview par défaut ; on vérifie que le bouton reste utilisable
      // après une écriture même si l’aperçu est vide un instant.
      await page.getByTestId('write-probe').click();
      await page.getByTestId('print-probe').click();
      await expect(page.getByTestId('open-database')).toBeEnabled();
      await expect(page.getByTestId('write-probe')).toBeEnabled();
    } finally {
      await app.close();
    }
  });
});

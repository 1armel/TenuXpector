/**
 * Point d'entrée du processus principal (étape 5 du plan U1, NFR8).
 */
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { startApplication, stopApplication, type RunningApplication } from './bootstrap';

const isDev = !app.isPackaged;
let running: RunningApplication | undefined;

function resolveDeps() {
  return {
    userDataPath: app.getPath('userData'),
    preloadPath: join(__dirname, '../preload/preload.cjs'),
    rendererUrl: process.env.ELECTRON_RENDERER_URL,
    rendererFilePath: join(__dirname, '../renderer/index.html'),
    isDev,
  };
}

void app.whenReady().then(() => {
  running = startApplication(resolveDeps());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      running = startApplication(resolveDeps());
    }
  });
});

app.on('window-all-closed', () => {
  stopApplication(running);
  running = undefined;
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopApplication(running);
  running = undefined;
});

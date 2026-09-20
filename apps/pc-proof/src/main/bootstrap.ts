/**
 * Bootstrap Electron testable hors effet de bord (étape 5, NFR8).
 */
import { BrowserWindow, ipcMain, session } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { ProbeApplication } from './probe-application';
import {
  applyNavigationPolicy,
  applySessionPolicy,
  hardenedWebPreferences,
} from './security';

export interface MainProcessDeps {
  readonly userDataPath: string;
  readonly preloadPath: string;
  readonly rendererUrl?: string | undefined;
  readonly rendererFilePath: string;
  readonly isDev: boolean;
}

export interface RunningApplication {
  readonly probe: ProbeApplication;
  readonly window: BrowserWindow;
}

function resolveDatabasePath(userDataPath: string): string {
  return join(userDataPath, 'pc-proof', 'probe.db');
}

export function createMainWindow(deps: MainProcessDeps): BrowserWindow {
  const window = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: hardenedWebPreferences({ preloadPath: deps.preloadPath }),
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  applySessionPolicy(session.defaultSession);

  if (deps.isDev && deps.rendererUrl !== undefined) {
    void window.loadURL(deps.rendererUrl);
  } else {
    void window.loadFile(deps.rendererFilePath);
  }

  window.webContents.on('did-finish-load', () => {
    const applicationUrl =
      deps.rendererUrl ??
      (typeof window.webContents.getURL === 'function'
        ? window.webContents.getURL()
        : `file://${deps.rendererFilePath}`);
    applyNavigationPolicy(window.webContents, applicationUrl);
  });

  return window;
}

export function startApplication(deps: MainProcessDeps): RunningApplication {
  const probe = new ProbeApplication({ databasePath: resolveDatabasePath(deps.userDataPath) });
  registerIpcHandlers(ipcMain, probe);
  const window = createMainWindow(deps);
  return { probe, window };
}

export function stopApplication(running: RunningApplication | undefined): void {
  running?.probe.close();
  if (running !== undefined && !running.window.isDestroyed()) {
    running.window.close();
  }
}

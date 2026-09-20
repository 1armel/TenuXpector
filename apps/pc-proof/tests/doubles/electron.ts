/**
 * Doublure Electron pour les tests unitaires (vitest alias).
 */
type Listener = (...args: unknown[]) => void;

const listeners = new Map<string, Set<Listener>>();

function onEvent(event: string, listener: Listener): void {
  const set = listeners.get(event) ?? new Set();
  set.add(listener);
  listeners.set(event, set);
}

export const app = {
  isPackaged: false,
  getPath(name: string): string {
    return `/tmp/tenu-electron-double/${name}`;
  },
  whenReady(): Promise<void> {
    return Promise.resolve();
  },
  on(event: string, listener: Listener): void {
    onEvent(event, listener);
  },
  quit(): void {
    /* no-op in tests */
  },
};

export class BrowserWindow {
  static #windows: BrowserWindow[] = [];

  readonly webContents = {
    getURL: (): string => 'file:///tmp/tenu-app/index.html',
    on: (event: string, listener: Listener): void => {
      onEvent(`wc:${event}`, listener);
      if (event === 'did-finish-load') {
        listener();
      }
    },
    setWindowOpenHandler: (_handler: (details: { url: string }) => { action: 'deny' }): void => {
      /* no-op */
    },
  };

  constructor(_options: Record<string, unknown>) {
    BrowserWindow.#windows.push(this);
  }

  static getAllWindows(): BrowserWindow[] {
    return [...BrowserWindow.#windows];
  }

  once(_event: string, listener: Listener): void {
    listener();
  }

  show(): void {
    /* no-op */
  }

  close(): void {
    BrowserWindow.#windows = BrowserWindow.#windows.filter((window) => window !== this);
  }

  isDestroyed(): boolean {
    return !BrowserWindow.#windows.includes(this);
  }

  loadURL(_url: string): Promise<void> {
    return Promise.resolve();
  }

  loadFile(_path: string): Promise<void> {
    return Promise.resolve();
  }
}

const ipcHandlers = new Map<string, Listener>();

export const ipcMain = {
  handle(channel: string, listener: Listener): void {
    ipcHandlers.set(channel, listener);
  },
  removeHandler(channel: string): void {
    ipcHandlers.delete(channel);
  },
};

export const session = {
  defaultSession: {
    webRequest: {
      onHeadersReceived(
        listener: (
          details: { responseHeaders?: Record<string, string[]> },
          callback: (response: { responseHeaders: Record<string, string[]> }) => void,
        ) => void,
      ): void {
        listener({ responseHeaders: {} }, () => undefined);
      },
    },
    setPermissionRequestHandler(
      handler: (
        webContents: unknown,
        permission: string,
        callback: (granted: boolean) => void,
      ) => void,
    ): void {
      handler({}, 'notifications', () => undefined);
    },
  },
};

export const contextBridge = {
  exposeInMainWorld(_key: string, _api: unknown): void {
    /* no-op */
  },
};

export const ipcRenderer = {
  invoke(_channel: string, _payload: unknown): Promise<unknown> {
    return Promise.resolve({ ok: true, value: {} });
  },
};

export default {
  app,
  BrowserWindow,
  ipcMain,
  session,
  contextBridge,
  ipcRenderer,
};

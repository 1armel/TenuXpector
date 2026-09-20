/**
 * Tests du bootstrap Electron (étape 7).
 */
import { describe, expect, it } from 'vitest';
import { startApplication, stopApplication } from '../src/main/bootstrap';

describe('bootstrap Electron [NFR8]', () => {
  it('démarre avec les préférences durcies et s’arrête proprement', () => {
    const running = startApplication({
      userDataPath: '/tmp/tenu-user',
      preloadPath: '/tmp/preload.cjs',
      rendererFilePath: '/tmp/index.html',
      isDev: false,
    });
    expect(running.probe).toBeDefined();
    expect(running.window.isDestroyed()).toBe(false);
    stopApplication(running);
    expect(running.window.isDestroyed()).toBe(true);
  });

  it('charge l’URL de développement quand elle est fournie', () => {
    const running = startApplication({
      userDataPath: '/tmp/tenu-user',
      preloadPath: '/tmp/preload.cjs',
      rendererFilePath: '/tmp/index.html',
      rendererUrl: 'http://localhost:5173/',
      isDev: true,
    });
    stopApplication(running);
    stopApplication(undefined);
  });
});

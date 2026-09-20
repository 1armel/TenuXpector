/**
 * Tests de la coquille Electron durcie (étape 7, NFR8).
 * Cas nominal + au moins deux erreurs / limites par fichier.
 */
import { describe, expect, it } from 'vitest';
import {
  CONTENT_SECURITY_POLICY,
  applyNavigationPolicy,
  applySessionPolicy,
  hardenedWebPreferences,
  isNavigationAllowed,
  type GuardableSession,
  type GuardableWebContents,
  type NavigationDenial,
  type PreventableEvent,
  type WindowOpenDetails,
} from '../src/main/security';

describe('hardenedWebPreferences [NFR8]', () => {
  it('active isolation, sandbox et webSecurity, sans Node dans le rendu', () => {
    const prefs = hardenedWebPreferences({ preloadPath: '/tmp/preload.cjs' });
    expect(prefs.contextIsolation).toBe(true);
    expect(prefs.nodeIntegration).toBe(false);
    expect(prefs.nodeIntegrationInWorker).toBe(false);
    expect(prefs.nodeIntegrationInSubFrames).toBe(false);
    expect(prefs.sandbox).toBe(true);
    expect(prefs.webSecurity).toBe(true);
    expect(prefs.allowRunningInsecureContent).toBe(false);
    expect(prefs.webviewTag).toBe(false);
    expect(prefs.preload).toBe('/tmp/preload.cjs');
  });

  it('refuse toute désactivation via options — seules preloadPath est acceptée', () => {
    const prefs = hardenedWebPreferences({ preloadPath: '/a.cjs' });
    expect(Object.keys(prefs).sort()).toEqual(
      [
        'allowRunningInsecureContent',
        'contextIsolation',
        'experimentalFeatures',
        'nodeIntegration',
        'nodeIntegrationInSubFrames',
        'nodeIntegrationInWorker',
        'preload',
        'sandbox',
        'spellcheck',
        'webSecurity',
        'webviewTag',
      ].sort(),
    );
  });
});

describe('isNavigationAllowed [NFR8]', () => {
  const appUrl = 'file:///opt/tenu/index.html';

  it('autorise un rechargement de la même page file:', () => {
    expect(isNavigationAllowed('file:///opt/tenu/index.html', appUrl)).toBe(true);
    expect(isNavigationAllowed('file:///opt/tenu/index.html?x=1#y', appUrl)).toBe(true);
  });

  it('refuse http/https et toute autre page file:', () => {
    expect(isNavigationAllowed('https://evil.example/', appUrl)).toBe(false);
    expect(isNavigationAllowed('http://localhost:3000/', appUrl)).toBe(false);
    expect(isNavigationAllowed('file:///opt/tenu/other.html', appUrl)).toBe(false);
  });

  it('refuse une URL illisible', () => {
    expect(isNavigationAllowed('not a url', appUrl)).toBe(false);
    expect(isNavigationAllowed('file:///opt/tenu/index.html', '%%%')).toBe(false);
  });
});

describe('applyNavigationPolicy [NFR8]', () => {
  function createContents(): {
    contents: GuardableWebContents;
    navigate: (url: string) => boolean;
    attachWebview: () => boolean;
    openWindow: (url: string) => { action: 'deny' };
  } {
    let navigateListener: ((event: PreventableEvent, url: string) => void) | undefined;
    let webviewListener: ((event: PreventableEvent) => void) | undefined;
    let openHandler: ((details: WindowOpenDetails) => { action: 'deny' }) | undefined;

    const contents: GuardableWebContents = {
      on(event, listener) {
        if (event === 'will-navigate') {
          navigateListener = listener as (event: PreventableEvent, url: string) => void;
        }
        if (event === 'will-attach-webview') {
          webviewListener = listener as (event: PreventableEvent) => void;
        }
        return contents;
      },
      setWindowOpenHandler(handler) {
        openHandler = handler;
      },
    };

    return {
      contents,
      navigate(url) {
        let prevented = false;
        navigateListener?.(
          {
            preventDefault() {
              prevented = true;
            },
          },
          url,
        );
        return prevented;
      },
      attachWebview() {
        let prevented = false;
        webviewListener?.({
          preventDefault() {
            prevented = true;
          },
        });
        return prevented;
      },
      openWindow(url) {
        if (openHandler === undefined) throw new Error('handler manquant');
        return openHandler({ url });
      },
    };
  }

  it('laisse passer la navigation locale et journalise le reste', () => {
    const denials: NavigationDenial[] = [];
    const harness = createContents();
    applyNavigationPolicy(harness.contents, 'file:///app/index.html', (denial) => {
      denials.push(denial);
    });

    expect(harness.navigate('file:///app/index.html')).toBe(false);
    expect(harness.navigate('https://example.com')).toBe(true);
    expect(harness.attachWebview()).toBe(true);
    expect(harness.openWindow('https://popup.example')).toEqual({ action: 'deny' });
    expect(denials.map((d) => d.kind)).toEqual(['navigate', 'webview', 'window-open']);
  });

  it('refuse une ouverture de fenêtre même vers file:', () => {
    const harness = createContents();
    applyNavigationPolicy(harness.contents, 'file:///app/index.html');
    expect(harness.openWindow('file:///app/index.html')).toEqual({ action: 'deny' });
  });
});

describe('applySessionPolicy [NFR8]', () => {
  it('injecte la CSP et refuse toute permission', () => {
    let capturedHeaders: Record<string, string[]> | undefined;
    let permissionGranted: boolean | undefined;

    const sessionLive: GuardableSession = {
      webRequest: {
        onHeadersReceived(listener) {
          listener(
            { responseHeaders: { 'Content-Security-Policy': ['old'], 'X-Test': ['1'] } },
            (response) => {
              capturedHeaders = response.responseHeaders;
            },
          );
        },
      },
      setPermissionRequestHandler(handler) {
        handler({}, 'notifications', (granted) => {
          permissionGranted = granted;
        });
      },
    };

    applySessionPolicy(sessionLive);
    expect(capturedHeaders?.['Content-Security-Policy']).toEqual([CONTENT_SECURITY_POLICY]);
    expect(capturedHeaders?.['X-Test']).toEqual(['1']);
    expect(permissionGranted).toBe(false);
  });

  it('la CSP n’autorise aucune origine distante ni unsafe-eval', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'none'");
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-eval');
    expect(CONTENT_SECURITY_POLICY).not.toContain('https:');
  });
});

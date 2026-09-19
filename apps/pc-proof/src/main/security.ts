/**
 * Durcissement de la coquille Electron (étape 5 du plan U1, NFR8).
 *
 * Ce fichier ne dépend pas d'Electron. Il décrit la politique — options de
 * fenêtre, politique de sécurité de contenu, prédicat de navigation — sous
 * forme de valeurs et de fonctions pures, et l'applique à des objets décrits
 * par des interfaces structurelles minimales. Deux conséquences voulues :
 *
 *   - la politique est testable sans lancer Electron, et elle l'est ;
 *   - elle ne peut pas être « oubliée » dans un chemin de code non couvert,
 *     puisqu'il n'y a qu'un seul endroit où elle est écrite.
 *
 * Le durcissement n'est pas rattrapable après coup : il est posé ici, à la
 * première ligne de l'application, pas au moment de l'empaquetage (U12).
 */

/**
 * Politique de sécurité de contenu. `default-src 'none'` puis autorisations
 * nommées : tout ce qui n'est pas listé est refusé. Aucune origine distante,
 * aucun `unsafe-inline`, aucun `unsafe-eval`.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "media-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export interface WindowSecurityOptions {
  readonly preloadPath: string;
}

/**
 * Préférences web de la fenêtre principale. Les cinq premières lignes sont les
 * non négociables du projet ; elles ne prennent jamais de valeur issue d'une
 * configuration, pour qu'aucun fichier ne puisse les désactiver.
 */
export interface HardenedWebPreferences {
  readonly preload: string;
  readonly contextIsolation: true;
  readonly nodeIntegration: false;
  readonly nodeIntegrationInWorker: false;
  readonly nodeIntegrationInSubFrames: false;
  readonly sandbox: true;
  readonly webSecurity: true;
  readonly allowRunningInsecureContent: false;
  readonly experimentalFeatures: false;
  readonly webviewTag: false;
  readonly spellcheck: false;
}

export function hardenedWebPreferences(options: WindowSecurityOptions): HardenedWebPreferences {
  return {
    preload: options.preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    webviewTag: false,
    spellcheck: false,
  };
}

/**
 * Seule la page locale de l'application peut être chargée. Un rechargement de
 * la même page est autorisé ; tout le reste — `http:`, `https:`, `about:`,
 * `data:`, un autre fichier — est refusé.
 *
 * Comparaison sur l'URL normalisée, fragment et paramètres ignorés : un
 * rechargement légitime peut porter un `?` ou un `#`.
 */
export function isNavigationAllowed(targetUrl: string, applicationUrl: string): boolean {
  let target: URL;
  let allowed: URL;
  try {
    target = new URL(targetUrl);
    allowed = new URL(applicationUrl);
  } catch {
    return false;
  }
  if (target.protocol !== 'file:') return false;
  if (allowed.protocol !== 'file:') return false;
  return decodeURIComponent(target.pathname) === decodeURIComponent(allowed.pathname);
}

export interface PreventableEvent {
  preventDefault(): void;
}

export interface WindowOpenDetails {
  readonly url: string;
}

export interface WindowOpenDecision {
  readonly action: 'deny';
}

/** Sous-ensemble de `WebContents` dont la politique a réellement besoin. */
export interface GuardableWebContents {
  on(
    event: 'will-navigate',
    listener: (event: PreventableEvent, url: string) => void,
  ): GuardableWebContents;
  on(
    event: 'will-attach-webview',
    listener: (event: PreventableEvent) => void,
  ): GuardableWebContents;
  setWindowOpenHandler(handler: (details: WindowOpenDetails) => WindowOpenDecision): void;
}

export interface NavigationDenial {
  readonly kind: 'navigate' | 'window-open' | 'webview';
  readonly url: string;
}

/**
 * Refuse par défaut la navigation, l'ouverture de fenêtre et l'attachement
 * d'un `<webview>`. `onDenied` sert au journal et aux tests ; il ne peut pas
 * renverser la décision.
 */
export function applyNavigationPolicy(
  contents: GuardableWebContents,
  applicationUrl: string,
  onDenied: (denial: NavigationDenial) => void = () => undefined,
): void {
  contents.on('will-navigate', (event, url) => {
    if (isNavigationAllowed(url, applicationUrl)) return;
    event.preventDefault();
    onDenied({ kind: 'navigate', url });
  });

  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
    onDenied({ kind: 'webview', url: '' });
  });

  contents.setWindowOpenHandler((details) => {
    onDenied({ kind: 'window-open', url: details.url });
    return { action: 'deny' };
  });
}

export interface HeadersReceivedDetails {
  readonly responseHeaders?: Record<string, string[]> | undefined;
}

export interface HeadersReceivedResponse {
  readonly responseHeaders: Record<string, string[]>;
}

/** Sous-ensemble de `Session` dont la politique a besoin. */
export interface GuardableSession {
  webRequest: {
    onHeadersReceived(
      listener: (
        details: HeadersReceivedDetails,
        callback: (response: HeadersReceivedResponse) => void,
      ) => void,
    ): void;
  };
  setPermissionRequestHandler(
    handler: (
      webContents: unknown,
      permission: string,
      callback: (granted: boolean) => void,
    ) => void,
  ): void;
}

/**
 * Injecte la politique de sécurité de contenu dans chaque réponse et refuse
 * toute demande de permission (caméra, géolocalisation, notifications…) : cette
 * unité n'en a besoin d'aucune.
 */
export function applySessionPolicy(session: GuardableSession): void {
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers: Record<string, string[]> = { ...(details.responseHeaders ?? {}) };
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'content-security-policy') delete headers[key];
    }
    headers['Content-Security-Policy'] = [CONTENT_SECURITY_POLICY];
    callback({ responseHeaders: headers });
  });

  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

"use strict";
const electron = require("electron");
const node_path = require("node:path");
const zod = require("zod");
const db = require("@tenu/db");
const node_fs = require("node:fs");
const node_child_process = require("node:child_process");
const node_os = require("node:os");
const MAX_PAYLOAD_BYTES = 64 * 1024;
const PRINT_TARGETS = ["preview", "usb", "spooler"];
const openDatabaseRequestSchema = zod.z.object({}).strict();
const openDatabaseResponseSchema = zod.z.object({
  /** Chemin du fichier ouvert — utile au diagnostic, jamais la clé. */
  path: zod.z.string().min(1),
  encrypted: zod.z.literal(true),
  journalMode: zod.z.string().min(1),
  schemaVersion: zod.z.number().int().min(0)
}).strict();
const writeProbeRequestSchema = zod.z.object({
  label: zod.z.string().min(1).max(120)
}).strict();
const writeProbeResponseSchema = zod.z.object({
  id: zod.z.string().min(1),
  label: zod.z.string().min(1),
  /** Horodatage de stockage : UTC, forme ISO 8601. */
  recordedAt: zod.z.string().min(1),
  /** Nombre total de lignes d'essai après écriture. */
  total: zod.z.number().int().min(1)
}).strict();
const printProbeRequestSchema = zod.z.object({
  target: zod.z.enum(PRINT_TARGETS),
  label: zod.z.string().min(1).max(120),
  /** Montant de démonstration, en entiers de FCFA (DEC-04). */
  amountFcfa: zod.z.number().int().min(0)
}).strict();
const printProbeResponseSchema = zod.z.object({
  /**
   * `false` n'est pas une erreur : une impression peut échouer sans que
   * l'opération appelante échoue. C'est précisément l'invariant que cette
   * unité doit prouver.
   */
  printed: zod.z.boolean(),
  via: zod.z.enum(PRINT_TARGETS),
  byteCount: zod.z.number().int().min(0),
  /** Renseigné seulement quand `printed` vaut `false`. */
  reason: zod.z.string().nullable(),
  preview: zod.z.string()
}).strict();
const IPC_CHANNELS = {
  openDatabase: "tenu:database:open",
  writeProbe: "tenu:database:write-probe",
  printProbe: "tenu:printer:print-probe"
};
const IPC_CONTRACT = {
  [IPC_CHANNELS.openDatabase]: {
    request: openDatabaseRequestSchema,
    response: openDatabaseResponseSchema
  },
  [IPC_CHANNELS.writeProbe]: {
    request: writeProbeRequestSchema,
    response: writeProbeResponseSchema
  },
  [IPC_CHANNELS.printProbe]: {
    request: printProbeRequestSchema,
    response: printProbeResponseSchema
  }
};
function isKnownChannel(channel) {
  return Object.prototype.hasOwnProperty.call(IPC_CONTRACT, channel);
}
function payloadByteLength(payload) {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function validate(schema, payload, code) {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return { ok: true, value: parsed.data };
  const detail = parsed.error.issues.map((issue) => `${issue.path.join(".") || "<racine>"} : ${issue.message}`).join(" ; ");
  return { ok: false, code, message: detail };
}
function success(value) {
  return { ok: true, value };
}
function failure(code, message) {
  return { ok: false, code, message };
}
function describeError(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue";
}
class IpcBackendError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "IpcBackendError";
  }
  code;
}
async function invokeBackend(channel, request, backend) {
  switch (channel) {
    case IPC_CHANNELS.openDatabase:
      return backend.openDatabase(request);
    case IPC_CHANNELS.writeProbe:
      return backend.writeProbe(request);
    case IPC_CHANNELS.printProbe:
      return backend.printProbe(request);
    default:
      throw new IpcBackendError("UNKNOWN_CHANNEL", `Canal non traité : ${channel}`);
  }
}
async function dispatchIpcRequest(channel, payload, backend) {
  if (!isKnownChannel(channel)) {
    return failure("UNKNOWN_CHANNEL", `Canal inconnu : ${channel}`);
  }
  const size = payloadByteLength(payload);
  if (size > MAX_PAYLOAD_BYTES) {
    return failure(
      "PAYLOAD_TOO_LARGE",
      `Charge de ${String(size)} octets, limite ${String(MAX_PAYLOAD_BYTES)}`
    );
  }
  const contract = IPC_CONTRACT[channel];
  const parsedRequest = validate(contract.request, payload, "INVALID_REQUEST");
  if (!parsedRequest.ok) return parsedRequest;
  let produced;
  try {
    produced = await invokeBackend(channel, parsedRequest.value, backend);
  } catch (error) {
    if (error instanceof IpcBackendError) return failure(error.code, error.message);
    return failure("INTERNAL_ERROR", describeError(error));
  }
  const parsedResponse = validate(contract.response, produced, "INVALID_RESPONSE");
  if (!parsedResponse.ok) return parsedResponse;
  return success(parsedResponse.value);
}
function registerIpcHandlers(registrar, backend) {
  for (const channel of Object.values(IPC_CHANNELS)) {
    registrar.removeHandler(channel);
    registrar.handle(channel, (_event, payload) => dispatchIpcRequest(channel, payload, backend));
  }
}
class PreviewReceiptPrinter {
  target = "preview";
  description = "Aperçu à l'écran (aucun matériel requis)";
  #jobs = [];
  get jobs() {
    return this.#jobs;
  }
  get lastPreview() {
    return this.#jobs.at(-1)?.preview;
  }
  isAvailable() {
    return Promise.resolve(true);
  }
  print(job) {
    this.#jobs.push(job);
    return Promise.resolve();
  }
  clear() {
    this.#jobs.length = 0;
  }
}
class PrinterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PrinterError";
  }
  code;
}
const DEFAULT_PRINT_TIMEOUT_MS = 1e4;
async function printSafely(printer, job, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PRINT_TIMEOUT_MS;
  const byteCount = job.bytes.length;
  let available;
  try {
    available = await printer.isAvailable();
  } catch (error) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: "PRINTER_UNAVAILABLE",
      reason: messageOf(error)
    };
  }
  if (!available) {
    return {
      printed: false,
      target: printer.target,
      byteCount,
      code: "PRINTER_UNAVAILABLE",
      reason: `Imprimante indisponible : ${printer.description}`
    };
  }
  let timer;
  const guard = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({
        printed: false,
        target: printer.target,
        byteCount,
        code: "PRINT_TIMEOUT",
        reason: `Aucune réponse de l'imprimante après ${String(timeoutMs)} ms`
      });
    }, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();
  });
  const attempt = (async () => {
    try {
      await printer.print(job);
      return { printed: true, target: printer.target, byteCount };
    } catch (error) {
      return {
        printed: false,
        target: printer.target,
        byteCount,
        code: error instanceof PrinterError ? error.code : "PRINTER_REFUSED",
        reason: messageOf(error)
      };
    }
  })();
  try {
    return await Promise.race([attempt, guard]);
  } finally {
    if (timer !== void 0) clearTimeout(timer);
  }
}
function messageOf(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue";
}
const windowsSpoolerAccess = {
  stageBytes(bytes) {
    const directory = node_fs.mkdtempSync(node_path.join(node_os.tmpdir(), "tenu-print-"));
    const filePath = node_path.join(directory, "receipt.bin");
    node_fs.writeFileSync(filePath, bytes);
    return filePath;
  },
  sendRaw(filePath, shareName) {
    node_child_process.execFileSync("cmd", ["/c", "copy", "/b", filePath, shareName], { stdio: "ignore" });
  },
  discard(filePath) {
    try {
      node_fs.rmSync(filePath, { force: true });
    } catch {
    }
  }
};
class SpoolerReceiptPrinter {
  target = "spooler";
  description;
  #shareName;
  #access;
  constructor(options) {
    this.#shareName = options.shareName;
    this.#access = options.access ?? windowsSpoolerAccess;
    this.description = `File d'impression Windows ${options.shareName}`;
  }
  isAvailable() {
    return Promise.resolve(this.#shareName.length > 0);
  }
  print(job) {
    let stagedPath;
    try {
      stagedPath = this.#access.stageBytes(job.bytes);
      this.#access.sendRaw(stagedPath, this.#shareName);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new PrinterError(
        "PRINTER_REFUSED",
        `La file d'impression ${this.#shareName} a refusé le travail : ${message}`
      );
    } finally {
      if (stagedPath !== void 0) this.#access.discard(stagedPath);
    }
  }
}
const nodeUsbDeviceAccess = {
  exists(devicePath) {
    if (devicePath.startsWith("\\\\.\\") || /^COM\d+$/i.test(devicePath)) return true;
    return node_fs.existsSync(devicePath);
  },
  write(devicePath, bytes) {
    node_fs.writeFileSync(devicePath, bytes);
  }
};
class UsbReceiptPrinter {
  target = "usb";
  description;
  #devicePath;
  #access;
  constructor(options) {
    this.#devicePath = options.devicePath;
    this.#access = options.access ?? nodeUsbDeviceAccess;
    this.description = `Périphérique USB ${options.devicePath}`;
  }
  isAvailable() {
    try {
      return Promise.resolve(this.#access.exists(this.#devicePath));
    } catch {
      return Promise.resolve(false);
    }
  }
  print(job) {
    try {
      this.#access.write(this.#devicePath, job.bytes);
      return Promise.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const interrupted = /EIO|ENXIO|ENODEV|EPIPE|EBUSY/.test(message);
      throw new PrinterError(
        interrupted ? "PRINT_INTERRUPTED" : "PRINTER_REFUSED",
        `Écriture sur ${this.#devicePath} impossible : ${message}`
      );
    }
  }
}
const USB_DEVICE_ENV_VAR = "TENU_PRINTER_DEVICE";
const SPOOLER_SHARE_ENV_VAR = "TENU_PRINTER_SHARE";
const DEFAULT_USB_DEVICE = "\\\\.\\USB001";
const DEFAULT_SPOOLER_SHARE = "\\\\localhost\\TICKET";
function createReceiptPrinter(target, env = process.env) {
  switch (target) {
    case "usb":
      return new UsbReceiptPrinter({ devicePath: env[USB_DEVICE_ENV_VAR] ?? DEFAULT_USB_DEVICE });
    case "spooler":
      return new SpoolerReceiptPrinter({
        shareName: env[SPOOLER_SHARE_ENV_VAR] ?? DEFAULT_SPOOLER_SHARE
      });
    case "preview":
      return new PreviewReceiptPrinter();
  }
}
const DISPLAY_TIME_ZONE = "Africa/Douala";
const CURRENCY_LABEL = "FCFA";
const GROUP_SEPARATOR = " ";
function formatAmountFcfa(amountFcfa) {
  if (!Number.isInteger(amountFcfa)) {
    throw new RangeError(
      `Montant non entier : ${String(amountFcfa)}. Les montants sont des entiers de FCFA (DEC-04).`
    );
  }
  const negative = amountFcfa < 0;
  const digits = Math.abs(amountFcfa).toString();
  let grouped = "";
  for (let index = 0; index < digits.length; index += 1) {
    const remaining = digits.length - index;
    const digit = digits[index] ?? "";
    grouped += digit;
    if (remaining > 1 && remaining % 3 === 1) grouped += GROUP_SEPARATOR;
  }
  return `${negative ? "-" : ""}${grouped}${GROUP_SEPARATOR}${CURRENCY_LABEL}`;
}
function pad2(value) {
  return value.toString().padStart(2, "0");
}
function doualaParts(instant) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = new Map(
    formatter.formatToParts(instant).map((part) => [part.type, part.value])
  );
  const read = (type) => parts.get(type) ?? "00";
  return {
    day: read("day"),
    month: read("month"),
    year: read("year"),
    // `Intl` rend parfois `24` pour minuit en `hour12: false`.
    hour: pad2(Number.parseInt(read("hour"), 10) % 24),
    minute: read("minute"),
    second: read("second")
  };
}
function formatDate(instant) {
  const parts = doualaParts(instant);
  return `${parts.day}/${parts.month}/${parts.year}`;
}
function formatDateTime(instant) {
  const parts = doualaParts(instant);
  return `${formatDate(instant)} ${parts.hour}:${parts.minute}:${parts.second}`;
}
const ESC = 27;
const GS = 29;
const LF = 10;
const COLUMNS_80MM = 48;
const ESCPOS_COMMANDS = {
  /** `ESC @` — réinitialise l'imprimante. */
  initialize: Uint8Array.from([ESC, 64]),
  /** `ESC t 16` — page de codes Windows-1252. */
  selectCodePageWindows1252: Uint8Array.from([ESC, 116, 16]),
  alignLeft: Uint8Array.from([ESC, 97, 0]),
  alignCenter: Uint8Array.from([ESC, 97, 1]),
  alignRight: Uint8Array.from([ESC, 97, 2]),
  boldOn: Uint8Array.from([ESC, 69, 1]),
  boldOff: Uint8Array.from([ESC, 69, 0]),
  /** `GS ! 0x11` — double hauteur et double largeur. */
  doubleSize: Uint8Array.from([GS, 33, 17]),
  normalSize: Uint8Array.from([GS, 33, 0]),
  /** `GS V 66 0` — coupe partielle après avance papier. */
  partialCut: Uint8Array.from([GS, 86, 66, 0]),
  lineFeed: Uint8Array.from([LF])
};
const CHARACTER_FALLBACKS = /* @__PURE__ */ new Map([
  [" ", " "],
  // espace insécable fine (séparateur de milliers)
  [" ", " "],
  // espace insécable
  ["’", "'"],
  ["‘", "'"],
  ["“", '"'],
  ["”", '"'],
  ["–", "-"],
  ["—", "-"],
  ["…", "..."]
]);
function encodeText(text) {
  let normalized = "";
  for (const character of text) {
    normalized += CHARACTER_FALLBACKS.get(character) ?? character;
  }
  const bytes = new Uint8Array(normalized.length);
  for (let index = 0; index < normalized.length; index += 1) {
    const codePoint = normalized.charCodeAt(index);
    bytes[index] = codePoint <= 255 ? codePoint : 63;
  }
  return bytes;
}
function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function textLine(text, options = {}) {
  const chunks = [];
  const align = options.align ?? "left";
  chunks.push(
    align === "center" ? ESCPOS_COMMANDS.alignCenter : align === "right" ? ESCPOS_COMMANDS.alignRight : ESCPOS_COMMANDS.alignLeft
  );
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOn);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.doubleSize);
  chunks.push(encodeText(text), ESCPOS_COMMANDS.lineFeed);
  if (options.doubleSize === true) chunks.push(ESCPOS_COMMANDS.normalSize);
  if (options.bold === true) chunks.push(ESCPOS_COMMANDS.boldOff);
  return concatBytes(chunks);
}
function separatorLine(columns = COLUMNS_80MM, character = "-") {
  return textLine(character.repeat(Math.max(1, columns)));
}
function labelledValueLine(label, value, columns = COLUMNS_80MM) {
  const padding = columns - label.length - value.length;
  const text = padding >= 1 ? `${label}${" ".repeat(padding)}${value}` : `${label} ${value}`.slice(-columns);
  return textLine(text);
}
function feedAndCut(feedLines = 4) {
  const feed = [];
  for (let index = 0; index < feedLines; index += 1) feed.push(ESCPOS_COMMANDS.lineFeed);
  return concatBytes([...feed, ESCPOS_COMMANDS.partialCut]);
}
function documentHeader() {
  return concatBytes([
    ESCPOS_COMMANDS.initialize,
    ESCPOS_COMMANDS.selectCodePageWindows1252,
    ESCPOS_COMMANDS.alignLeft
  ]);
}
const TITLE = "TICKET D'ESSAI";
const SUBTITLE = "TenuXpector - preuve de concept";
const FOOTER = "Ce ticket ne vaut pas justificatif de vente.";
function composeProbeReceipt(content) {
  const columns = content.columns ?? COLUMNS_80MM;
  const amount = formatAmountFcfa(content.amountFcfa);
  const timestamp = formatDateTime(content.printedAt);
  const lines = [
    { bytes: textLine(TITLE, { align: "center", bold: true, doubleSize: true }), text: TITLE },
    { bytes: textLine(SUBTITLE, { align: "center" }), text: SUBTITLE },
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    { bytes: labelledValueLine("Date", timestamp, columns), text: padPair("Date", timestamp, columns) },
    { bytes: labelledValueLine("Libelle", content.label, columns), text: padPair("Libelle", content.label, columns) }
  ];
  if (content.entryId !== void 0) {
    lines.push({
      bytes: labelledValueLine("Reference", content.entryId, columns),
      text: padPair("Reference", content.entryId, columns)
    });
  }
  lines.push(
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    {
      bytes: labelledValueLine("Montant de demonstration", amount, columns),
      text: padPair("Montant de demonstration", amount, columns)
    },
    { bytes: separatorLine(columns), text: "-".repeat(columns) },
    { bytes: textLine(FOOTER, { align: "center" }), text: FOOTER }
  );
  const bytes = concatBytes([documentHeader(), ...lines.map((line) => line.bytes), feedAndCut()]);
  const preview = lines.map((line) => line.text).join("\n");
  return { bytes, preview };
}
function padPair(label, value, columns) {
  const padding = columns - label.length - value.length;
  return padding >= 1 ? `${label}${" ".repeat(padding)}${value}` : `${label} ${value}`.slice(-columns);
}
class ProbeApplication {
  #options;
  #now;
  #database;
  constructor(options) {
    this.#options = options;
    this.#now = options.now ?? (() => Date.now());
  }
  get database() {
    return this.#database;
  }
  openDatabase() {
    try {
      if (this.#database === void 0 || this.#database.isClosed) {
        const env = this.#options.env ?? process.env;
        const resolved = db.resolveEncryptionKey(env);
        const open = this.#options.openDatabase ?? db.openEncryptedDatabase;
        this.#database = open({
          filePath: this.#options.databasePath,
          encryptionKey: resolved.key,
          now: this.#now
        });
      }
      return Promise.resolve({
        path: this.#database.filePath,
        encrypted: true,
        journalMode: this.#database.journalMode,
        schemaVersion: this.#database.schemaVersion
      });
    } catch (error) {
      if (error instanceof db.UnencryptedDatabaseError || error instanceof db.InvalidEncryptionKeyError) {
        return Promise.reject(new IpcBackendError("DATABASE_UNAVAILABLE", error.message));
      }
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  writeProbe(request) {
    const database = this.#database;
    if (database === void 0 || database.isClosed) {
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_UNAVAILABLE",
          "La base n'est pas ouverte. Ouvrez-la avant d'écrire."
        )
      );
    }
    try {
      const entry = database.insertProbeEntry(request.label);
      return Promise.resolve({
        id: entry.id,
        label: entry.label,
        recordedAt: entry.recordedAt,
        total: database.countProbeEntries()
      });
    } catch (error) {
      return Promise.reject(
        new IpcBackendError(
          "DATABASE_FAILED",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
  async printProbe(request) {
    const composed = composeProbeReceipt({
      label: request.label,
      amountFcfa: request.amountFcfa,
      printedAt: new Date(this.#now())
    });
    const factory = this.#options.createPrinter ?? createReceiptPrinter;
    const printer = factory(request.target);
    const outcome = await printSafely(
      printer,
      { bytes: composed.bytes, preview: composed.preview },
      this.#options.printTimeoutMs === void 0 ? {} : { timeoutMs: this.#options.printTimeoutMs }
    );
    return {
      printed: outcome.printed,
      via: request.target,
      byteCount: outcome.byteCount,
      reason: outcome.printed ? null : outcome.reason,
      preview: composed.preview
    };
  }
  close() {
    this.#database?.close();
    this.#database = void 0;
  }
}
const CONTENT_SECURITY_POLICY = [
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
  "frame-ancestors 'none'"
].join("; ");
function hardenedWebPreferences(options) {
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
    spellcheck: false
  };
}
function isNavigationAllowed(targetUrl, applicationUrl) {
  let target;
  let allowed;
  try {
    target = new URL(targetUrl);
    allowed = new URL(applicationUrl);
  } catch {
    return false;
  }
  if (target.protocol !== "file:") return false;
  if (allowed.protocol !== "file:") return false;
  return decodeURIComponent(target.pathname) === decodeURIComponent(allowed.pathname);
}
function applyNavigationPolicy(contents, applicationUrl, onDenied = () => void 0) {
  contents.on("will-navigate", (event, url) => {
    if (isNavigationAllowed(url, applicationUrl)) return;
    event.preventDefault();
    onDenied({ kind: "navigate", url });
  });
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
    onDenied({ kind: "webview", url: "" });
  });
  contents.setWindowOpenHandler((details) => {
    onDenied({ kind: "window-open", url: details.url });
    return { action: "deny" };
  });
}
function applySessionPolicy(session) {
  session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders ?? {} };
    const nextHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== "content-security-policy") {
        nextHeaders[key] = value;
      }
    }
    nextHeaders["Content-Security-Policy"] = [CONTENT_SECURITY_POLICY];
    callback({ responseHeaders: nextHeaders });
  });
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}
function resolveDatabasePath(userDataPath) {
  return node_path.join(userDataPath, "pc-proof", "probe.db");
}
function createMainWindow(deps) {
  const window = new electron.BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: hardenedWebPreferences({ preloadPath: deps.preloadPath })
  });
  window.once("ready-to-show", () => {
    window.show();
  });
  applySessionPolicy(electron.session.defaultSession);
  if (deps.isDev && deps.rendererUrl !== void 0) {
    void window.loadURL(deps.rendererUrl);
  } else {
    void window.loadFile(deps.rendererFilePath);
  }
  window.webContents.on("did-finish-load", () => {
    const applicationUrl = deps.rendererUrl ?? (typeof window.webContents.getURL === "function" ? window.webContents.getURL() : `file://${deps.rendererFilePath}`);
    applyNavigationPolicy(window.webContents, applicationUrl);
  });
  return window;
}
function startApplication(deps) {
  const probe = new ProbeApplication({ databasePath: resolveDatabasePath(deps.userDataPath) });
  registerIpcHandlers(electron.ipcMain, probe);
  const window = createMainWindow(deps);
  return { probe, window };
}
function stopApplication(running2) {
  running2?.probe.close();
  if (running2 !== void 0 && !running2.window.isDestroyed()) {
    running2.window.close();
  }
}
const isDev = !electron.app.isPackaged;
let running;
function resolveDeps() {
  return {
    userDataPath: electron.app.getPath("userData"),
    preloadPath: node_path.join(__dirname, "../preload/preload.cjs"),
    rendererUrl: process.env.ELECTRON_RENDERER_URL,
    rendererFilePath: node_path.join(__dirname, "../renderer/index.html"),
    isDev
  };
}
void electron.app.whenReady().then(() => {
  running = startApplication(resolveDeps());
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      running = startApplication(resolveDeps());
    }
  });
});
electron.app.on("window-all-closed", () => {
  stopApplication(running);
  running = void 0;
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("before-quit", () => {
  stopApplication(running);
  running = void 0;
});

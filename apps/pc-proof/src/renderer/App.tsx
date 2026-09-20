/**
 * Interface minimale de la preuve PC (étape 5–6).
 *
 * Trois actions seulement : ouvrir la base, écrire une ligne, imprimer un
 * ticket d'essai. Aucune règle métier.
 */
import { useState, type JSX } from 'react';
import type {
  OpenDatabaseResponse,
  PrintProbeResponse,
  TenuBridge,
  WriteProbeResponse,
} from '../shared/ipc-contract';

declare global {
  interface Window {
    tenu: TenuBridge;
  }
}

type StatusTone = 'idle' | 'ok' | 'error';

interface StatusLine {
  tone: StatusTone;
  text: string;
}

export function App(): JSX.Element {
  const [status, setStatus] = useState<StatusLine>({
    tone: 'idle',
    text: 'Prêt. Ouvrez la base pour commencer.',
  });
  const [databaseInfo, setDatabaseInfo] = useState<OpenDatabaseResponse | undefined>();
  const [lastWrite, setLastWrite] = useState<WriteProbeResponse | undefined>();
  const [lastPrint, setLastPrint] = useState<PrintProbeResponse | undefined>();
  const [busy, setBusy] = useState(false);

  async function openDatabase(): Promise<void> {
    setBusy(true);
    try {
      const result = await window.tenu.openDatabase({});
      if (!result.ok) {
        setStatus({ tone: 'error', text: `${result.code} — ${result.message}` });
        return;
      }
      setDatabaseInfo(result.value);
      setStatus({
        tone: 'ok',
        text: `Base ouverte (${result.value.journalMode}, schéma v${String(result.value.schemaVersion)})`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function writeProbe(): Promise<void> {
    setBusy(true);
    try {
      const label = `essai-${new Date().toISOString()}`;
      const result = await window.tenu.writeProbe({ label });
      if (!result.ok) {
        setStatus({ tone: 'error', text: `${result.code} — ${result.message}` });
        return;
      }
      setLastWrite(result.value);
      setStatus({
        tone: 'ok',
        text: `Ligne écrite : ${result.value.id} (total ${String(result.value.total)})`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function printProbe(): Promise<void> {
    setBusy(true);
    try {
      const result = await window.tenu.printProbe({
        target: 'preview',
        label: lastWrite?.label ?? 'ticket-essai',
        amountFcfa: 12_500,
      });
      if (!result.ok) {
        setStatus({ tone: 'error', text: `${result.code} — ${result.message}` });
        return;
      }
      setLastPrint(result.value);
      setStatus({
        tone: result.value.printed ? 'ok' : 'error',
        text: result.value.printed
          ? `Ticket composé (${String(result.value.byteCount)} octets via ${result.value.via})`
          : `Impression non effectuée : ${result.value.reason ?? 'raison inconnue'}`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app" data-testid="pc-proof-app">
      <header className="app__header">
        <h1>TenuXpector</h1>
        <p>Preuve de concept PC — base chiffrée et ticket d&apos;essai</p>
      </header>

      <section className="app__actions" aria-label="Actions de preuve">
        <button
          type="button"
          data-testid="open-database"
          disabled={busy}
          onClick={() => {
            void openDatabase();
          }}
        >
          Ouvrir la base
        </button>
        <button
          type="button"
          data-testid="write-probe"
          disabled={busy || databaseInfo === undefined}
          onClick={() => {
            void writeProbe();
          }}
        >
          Écrire une ligne
        </button>
        <button
          type="button"
          data-testid="print-probe"
          disabled={busy}
          onClick={() => {
            void printProbe();
          }}
        >
          Imprimer le ticket d&apos;essai
        </button>
      </section>

      <p className={`app__status app__status--${status.tone}`} data-testid="status-line" role="status">
        {status.text}
      </p>

      {databaseInfo !== undefined ? (
        <pre className="app__panel" data-testid="database-info">
          {JSON.stringify(databaseInfo, null, 2)}
        </pre>
      ) : null}

      {lastPrint !== undefined ? (
        <pre className="app__panel app__panel--preview" data-testid="print-preview">
          {lastPrint.preview}
        </pre>
      ) : null}
    </main>
  );
}

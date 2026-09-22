/**
 * Interface minimale de la preuve PC + onglet Catalogue C1.
 */
import { useState, type JSX } from 'react';
import type {
  OpenDatabaseResponse,
  PrintProbeResponse,
  TenuBridge,
  WriteProbeResponse,
} from '../shared/ipc-contract';
import { CatalogShell, type CatalogSessionProps } from './catalog/CatalogShell';
import type { CatalogUiRole } from './catalog/RoleGate';

declare global {
  interface Window {
    tenu: TenuBridge;
  }
}

type StatusTone = 'idle' | 'ok' | 'error';
type AppTab = 'preuve' | 'catalogue';

interface StatusLine {
  tone: StatusTone;
  text: string;
}

export function App(): JSX.Element {
  const [tab, setTab] = useState<AppTab>('preuve');
  const [status, setStatus] = useState<StatusLine>({
    tone: 'idle',
    text: 'Prêt. Ouvrez la base pour commencer.',
  });
  const [databaseInfo, setDatabaseInfo] = useState<OpenDatabaseResponse | undefined>();
  const [lastWrite, setLastWrite] = useState<WriteProbeResponse | undefined>();
  const [lastPrint, setLastPrint] = useState<PrintProbeResponse | undefined>();
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<CatalogUiRole>('gerant');
  const [catalogSession, setCatalogSession] = useState<CatalogSessionProps | undefined>();

  async function openDatabase(): Promise<void> {
    setBusy(true);
    try {
      const result = await window.tenu.openDatabase({});
      if (!result.ok) {
        setStatus({ tone: 'error', text: `${result.code} — ${result.message}` });
        return;
      }
      setDatabaseInfo(result.value);
      if (result.value.demoSession !== null) {
        const demo = result.value.demoSession;
        const actorUserId =
          role === 'vendeur'
            ? demo.vendeurId
            : role === 'proprietaire'
              ? demo.proprietaireId
              : demo.gerantId;
        setCatalogSession({
          tenantId: demo.tenantId,
          actorUserId,
          deviceId: 'pc-proof-demo',
          role,
        });
      }
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

  function onRoleChange(next: CatalogUiRole): void {
    setRole(next);
    if (databaseInfo?.demoSession !== null && databaseInfo?.demoSession !== undefined) {
      const demo = databaseInfo.demoSession;
      setCatalogSession({
        tenantId: demo.tenantId,
        actorUserId:
          next === 'vendeur'
            ? demo.vendeurId
            : next === 'proprietaire'
              ? demo.proprietaireId
              : demo.gerantId,
        deviceId: 'pc-proof-demo',
        role: next,
      });
    }
  }

  return (
    <main className="app" data-testid="pc-proof-app">
      <header className="app__header">
        <h1>TenuXpector</h1>
        <p>Preuve PC — base chiffrée, ticket d&apos;essai et catalogue C1</p>
      </header>

      <nav className="app__tabs" aria-label="Sections" data-testid="app-tabs">
        <button
          type="button"
          data-testid="tab-preuve"
          className={tab === 'preuve' ? 'is-active' : undefined}
          onClick={() => {
            setTab('preuve');
          }}
        >
          Preuve
        </button>
        <button
          type="button"
          data-testid="tab-catalogue"
          className={tab === 'catalogue' ? 'is-active' : undefined}
          onClick={() => {
            setTab('catalogue');
          }}
        >
          Catalogue
        </button>
      </nav>

      {tab === 'preuve' ? (
        <>
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

          <p
            className={`app__status app__status--${status.tone}`}
            data-testid="status-line"
            role="status"
          >
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
        </>
      ) : (
        <section aria-label="Catalogue">
          <label className="catalog-role" data-testid="catalog-role-picker">
            Rôle de démonstration
            <select
              data-testid="catalog-role-select"
              value={role}
              onChange={(event) => {
                onRoleChange(event.target.value as CatalogUiRole);
              }}
            >
              <option value="vendeur">Vendeur</option>
              <option value="gerant">Gérant</option>
              <option value="proprietaire">Propriétaire</option>
            </select>
          </label>
          {catalogSession === undefined ? (
            <p data-testid="catalog-need-database">
              Ouvrez d&apos;abord la base (onglet Preuve) pour charger le catalogue démo.
            </p>
          ) : (
            <CatalogShell bridge={window.tenu} session={catalogSession} />
          )}
        </section>
      )}
    </main>
  );
}

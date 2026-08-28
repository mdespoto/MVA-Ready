import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../db";
import type { Client } from "../types";
import { getClientBalance, type ClientBalance } from "../utils/balance";
import ScheduleTab from "../components/ScheduleTab";
import AttendanceTab from "../components/AttendanceTab";
import PaymentsTab from "../components/PaymentsTab";
import ResultsTab from "../components/ResultsTab";

const TABS = ["raspored", "dolasci", "uplate", "rezultati"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  raspored: "Raspored",
  dolasci: "Evidencija dolazaka",
  uplate: "Uplate",
  rezultati: "Rezultati",
};

export default function ClientDetail() {
  const { id } = useParams();
  const clientId = Number(id);
  const [client, setClient] = useState<Client | null>(null);
  const [balance, setBalance] = useState<ClientBalance | null>(null);
  const [tab, setTab] = useState<Tab>("raspored");
  const [editing, setEditing] = useState(false);

  async function load() {
    const c = await db.clients.get(clientId);
    setClient(c ?? null);
    setBalance(await getClientBalance(clientId));
  }

  useEffect(() => {
    load();
  }, [clientId]);

  if (!client) {
    return (
      <div>
        <Link to="/klijenti">← Natrag na klijente</Link>
        <div className="card empty-state">Klijent nije pronađen.</div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/klijenti" className="text-muted">← Natrag na klijente</Link>

      <div className="flex-between" style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
        <h1 style={{ marginBottom: 0 }}>{client.name}</h1>
        <span className={"badge " + (balance && balance.remaining <= 2 ? "badge-amber" : "badge-green")}>
          Preostalo: {balance?.remaining ?? 0} dolazaka
        </span>
      </div>

      <div className="card">
        {editing ? (
          <ClientEditForm client={client} onDone={() => { setEditing(false); load(); }} />
        ) : (
          <div className="flex-between">
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              {client.phone && <span>📞 {client.phone} &nbsp;</span>}
              {client.email && <span>✉️ {client.email}</span>}
              {!client.phone && !client.email && <span>Nema kontakt podataka.</span>}
            </div>
            <button className="btn btn-sm" onClick={() => setEditing(true)}>Uredi podatke</button>
          </div>
        )}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <a
            key={t}
            className={"tab" + (tab === t ? " active" : "")}
            onClick={(e) => { e.preventDefault(); setTab(t); }}
            href={`#${t}`}
          >
            {TAB_LABELS[t]}
          </a>
        ))}
      </div>

      {tab === "raspored" && <ScheduleTab clientId={clientId} />}
      {tab === "dolasci" && <AttendanceTab clientId={clientId} />}
      {tab === "uplate" && <PaymentsTab clientId={clientId} onChange={load} />}
      {tab === "rezultati" && <ResultsTab clientId={clientId} />}
    </div>
  );
}

function ClientEditForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [active, setActive] = useState(client.active);

  async function save() {
    await db.clients.update(client.id!, { name, phone, email, active });
    onDone();
  }

  return (
    <div>
      <div className="form-grid">
        <div className="form-row">
          <label>Ime i prezime</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Telefon</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-row">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Status</label>
          <select value={active ? "1" : "0"} onChange={(e) => setActive(e.target.value === "1")}>
            <option value="1">Aktivan</option>
            <option value="0">Neaktivan</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={save}>Spremi</button>
        <button className="btn" onClick={onDone}>Odustani</button>
      </div>
    </div>
  );
}

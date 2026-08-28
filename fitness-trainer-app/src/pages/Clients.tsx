import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../db";
import type { Client } from "../types";
import { getAllBalances, LOW_BALANCE_THRESHOLD, type ClientBalance } from "../utils/balance";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [balances, setBalances] = useState<Record<number, ClientBalance>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function load() {
    const cl = await db.clients.orderBy("name").toArray();
    setClients(cl);
    setBalances(await getAllBalances());
  }

  useEffect(() => {
    load();
  }, []);

  async function addClient() {
    if (!name.trim()) return;
    await db.clients.add({ name: name.trim(), phone, email, active: true, createdAt: new Date().toISOString() });
    setName("");
    setPhone("");
    setEmail("");
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "1.25rem" }}>
        <h1>Klijenti</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Zatvori" : "+ Novi klijent"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="form-grid">
            <div className="form-row">
              <label>Ime i prezime</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Anić" />
            </div>
            <div className="form-row">
              <label>Telefon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-row">
              <label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={addClient} disabled={!name.trim()}>
            Spremi klijenta
          </button>
        </div>
      )}

      <div className="card">
        {clients.length === 0 ? (
          <div className="empty-state">Još nema klijenata.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ime</th>
                <th>Telefon</th>
                <th>Preostalo dolazaka</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const bal = balances[c.id as number];
                const low = bal && bal.remaining <= LOW_BALANCE_THRESHOLD;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/klijenti/${c.id}`}>{c.name}</Link>
                    </td>
                    <td className="text-muted">{c.phone || "—"}</td>
                    <td>
                      <span className={"badge " + (low ? "badge-amber" : "badge-green")}>
                        {bal ? bal.remaining : 0}
                      </span>
                    </td>
                    <td>
                      {c.active ? <span className="badge badge-green">aktivan</span> : <span className="badge badge-gray">neaktivan</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

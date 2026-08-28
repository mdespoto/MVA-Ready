import { useEffect, useState } from "react";
import { db } from "../db";
import type { Payment } from "../types";
import { getClientBalance, type ClientBalance } from "../utils/balance";
import { isoDate } from "../utils/week";

export default function PaymentsTab({ clientId, onChange }: { clientId: number; onChange?: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<ClientBalance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(isoDate(new Date()));
  const [amount, setAmount] = useState<number | "">("");
  const [sessionsIncluded, setSessionsIncluded] = useState<number | "">(8);
  const [note, setNote] = useState("");

  async function load() {
    const p = await db.payments.where("clientId").equals(clientId).toArray();
    p.sort((a, b) => b.date.localeCompare(a.date));
    setPayments(p);
    setBalance(await getClientBalance(clientId));
    onChange?.();
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function addPayment() {
    if (!amount || !sessionsIncluded) return;
    await db.payments.add({ clientId, date, amount: Number(amount), sessionsIncluded: Number(sessionsIncluded), note });
    setAmount("");
    setSessionsIncluded(8);
    setNote("");
    setShowForm(false);
    load();
  }

  async function removePayment(p: Payment) {
    await db.payments.delete(p.id!);
    load();
  }

  return (
    <div className="card">
      <div className="flex-between">
        <h3>Uplate i paketi</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Zatvori" : "+ Nova uplata"}
        </button>
      </div>

      {balance && (
        <div className="flex gap-2" style={{ margin: "0.75rem 0" }}>
          <span className="badge badge-gray">Ukupno kupljeno: {balance.totalPurchased}</span>
          <span className="badge badge-gray">Iskorišteno: {balance.totalConsumed}</span>
          <span className={"badge " + (balance.remaining <= 2 ? "badge-amber" : "badge-green")}>
            Preostalo: {balance.remaining}
          </span>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <div className="form-grid">
            <div className="form-row">
              <label>Datum uplate</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Iznos (€)</label>
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="form-row">
              <label>Broj dolazaka u paketu</label>
              <input type="number" min={1} value={sessionsIncluded} onChange={(e) => setSessionsIncluded(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="form-row">
              <label>Napomena</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. paket 8 dolazaka" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={addPayment} disabled={!amount || !sessionsIncluded}>
            Spremi uplatu
          </button>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="empty-state">Još nema evidentiranih uplata.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Iznos</th>
              <th>Dolazaka</th>
              <th>Napomena</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.date)}</td>
                <td>{p.amount.toFixed(2)} €</td>
                <td>{p.sessionsIncluded}</td>
                <td className="text-muted">{p.note || "—"}</td>
                <td>
                  <button className="btn btn-sm btn-red" onClick={() => removePayment(p)}>
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}.`;
}

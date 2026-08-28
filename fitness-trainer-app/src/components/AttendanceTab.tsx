import { useEffect, useState } from "react";
import { db } from "../db";
import type { SessionRecord } from "../types";
import { STATUS_LABELS } from "../types";

export default function AttendanceTab({ clientId }: { clientId: number }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  async function load() {
    const s = await db.sessions.where("clientId").equals(clientId).toArray();
    s.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    setSessions(s);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function remove(s: SessionRecord) {
    await db.sessions.delete(s.id!);
    load();
  }

  const attended = sessions.filter((s) => s.status === "attended").length;
  const counted = sessions.filter((s) => s.countsAgainstPackage).length;

  return (
    <div className="card">
      <div className="flex-between">
        <h3>Evidencija dolazaka</h3>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>
          Odrađeno: {attended} · Naplativo (ide na paket): {counted}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">Još nema evidentiranih dolazaka.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Vrijeme</th>
              <th>Status</th>
              <th>Ide na paket</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{formatDate(s.date)}</td>
                <td>{s.time}</td>
                <td>
                  <span className={"badge " + statusBadge(s.status)}>{STATUS_LABELS[s.status]}</span>
                </td>
                <td>{s.countsAgainstPackage ? "da" : "ne"}</td>
                <td>
                  <button className="btn btn-sm btn-red" onClick={() => remove(s)}>
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

function statusBadge(status: SessionRecord["status"]) {
  switch (status) {
    case "attended":
      return "badge-green";
    case "cancelled_ontime":
      return "badge-gray";
    case "cancelled_late":
      return "badge-amber";
    case "no_show":
      return "badge-red";
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}.`;
}

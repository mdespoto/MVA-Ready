import { useEffect, useState } from "react";
import { db } from "../db";
import type { ScheduleSlot, Weekday } from "../types";
import { WEEKDAY_LABELS } from "../types";

export default function ScheduleTab({ clientId }: { clientId: number }) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [weekday, setWeekday] = useState<Weekday>(0);
  const [time, setTime] = useState("18:00");

  async function load() {
    const s = await db.scheduleSlots.where("clientId").equals(clientId).toArray();
    s.sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time));
    setSlots(s);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function addSlot() {
    await db.scheduleSlots.add({ clientId, weekday, time, active: true });
    load();
  }

  async function toggleSlot(slot: ScheduleSlot) {
    await db.scheduleSlots.update(slot.id!, { active: !slot.active });
    load();
  }

  async function removeSlot(slot: ScheduleSlot) {
    await db.scheduleSlots.delete(slot.id!);
    load();
  }

  return (
    <div className="card">
      <h3>Tjedni termini</h3>
      <p className="text-muted" style={{ marginTop: 0 }}>
        Ovi termini se ponavljaju svaki tjedan i automatski se pojavljuju na tjednom pregledu.
      </p>

      {slots.length === 0 ? (
        <div className="empty-state">Nema postavljenih termina.</div>
      ) : (
        <table style={{ marginBottom: "1rem" }}>
          <thead>
            <tr>
              <th>Dan</th>
              <th>Vrijeme</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td>{WEEKDAY_LABELS[s.weekday]}</td>
                <td>{s.time}</td>
                <td>
                  <span className={"badge " + (s.active ? "badge-green" : "badge-gray")}>
                    {s.active ? "aktivan" : "pauziran"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-sm" onClick={() => toggleSlot(s)}>
                      {s.active ? "Pauziraj" : "Aktiviraj"}
                    </button>
                    <button className="btn btn-sm btn-red" onClick={() => removeSlot(s)}>
                      Ukloni
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="form-grid" style={{ maxWidth: 420 }}>
        <div className="form-row">
          <label>Dan u tjednu</label>
          <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}>
            {Object.entries(WEEKDAY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Vrijeme</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={addSlot}>
        + Dodaj termin
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../db";
import type { Client, ScheduleSlot, SessionRecord, SessionStatus } from "../types";
import { STATUS_LABELS, WEEKDAY_LABELS } from "../types";
import { addDays, format } from "date-fns";
import { getWeekDates, getWeekStart, isoDate, isPast, isToday } from "../utils/week";
import { getAllBalances, LOW_BALANCE_THRESHOLD, type ClientBalance } from "../utils/balance";

interface PlannedItem {
  clientId: number;
  time: string;
  slotId: number;
  iso: string;
  record?: SessionRecord;
}

const STATUS_BUTTONS: { status: SessionStatus; label: string; cls: string }[] = [
  { status: "attended", label: "Odrađano", cls: "btn-green" },
  { status: "cancelled_ontime", label: "Otkazano na vrijeme", cls: "btn-gray" },
  { status: "cancelled_late", label: "Otkazano kasno", cls: "btn-amber" },
  { status: "no_show", label: "Nije se pojavio/la", cls: "btn-red" },
];

export default function Dashboard() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [balances, setBalances] = useState<Record<number, ClientBalance>>({});
  const [addFormDay, setAddFormDay] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const weekStart = useMemo(() => getWeekStart(anchor), [anchor]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekEndIso = isoDate(addDays(weekStart, 6));
  const weekStartIso = isoDate(weekStart);

  useEffect(() => {
    (async () => {
      const [cl, sl] = await Promise.all([db.clients.toArray(), db.scheduleSlots.toArray()]);
      setClients(cl);
      setSlots(sl);
      setBalances(await getAllBalances());
    })();
  }, [refreshTick]);

  useEffect(() => {
    (async () => {
      const all = await db.sessions.where("date").between(weekStartIso, weekEndIso, true, true).toArray();
      setSessions(all);
    })();
  }, [weekStartIso, weekEndIso, refreshTick]);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  function refresh() {
    setRefreshTick((t) => t + 1);
  }

  function plannedForDay(iso: string, weekday: number): PlannedItem[] {
    const daySlots = slots.filter((s) => s.active && s.weekday === weekday);
    return daySlots
      .map((slot) => {
        const record = sessions.find((s) => s.clientId === slot.clientId && s.date === iso && s.slotId === slot.id);
        return { clientId: slot.clientId, time: slot.time, slotId: slot.id as number, iso, record };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  function extraForDay(iso: string): SessionRecord[] {
    return sessions.filter((s) => s.date === iso && !s.slotId);
  }

  async function markStatus(item: PlannedItem, status: SessionStatus) {
    const countsAgainstPackage = status !== "cancelled_ontime";
    if (item.record?.id) {
      await db.sessions.update(item.record.id, { status, countsAgainstPackage });
    } else {
      await db.sessions.add({
        clientId: item.clientId,
        date: item.iso,
        time: item.time,
        status,
        countsAgainstPackage,
        slotId: item.slotId,
      });
    }
    refresh();
  }

  async function markExtraStatus(record: SessionRecord, status: SessionStatus) {
    const countsAgainstPackage = status !== "cancelled_ontime";
    await db.sessions.update(record.id!, { status, countsAgainstPackage });
    refresh();
  }

  async function unmark(record: SessionRecord) {
    await db.sessions.delete(record.id!);
    refresh();
  }

  async function addExtraSession(iso: string, clientId: number, time: string) {
    await db.sessions.add({
      clientId,
      date: iso,
      time,
      status: "attended",
      countsAgainstPackage: true,
    });
    setAddFormDay(null);
    refresh();
  }

  const lowBalanceClients = clients
    .filter((c) => c.active)
    .map((c) => ({ client: c, balance: balances[c.id as number] }))
    .filter((x) => x.balance && x.balance.remaining <= LOW_BALANCE_THRESHOLD);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "1.25rem" }}>
        <h1>Tjedni pregled</h1>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setAnchor(addDays(weekStart, -7))}>← Prošli tjedan</button>
          <button className="btn btn-sm" onClick={() => setAnchor(new Date())}>Danas</button>
          <button className="btn btn-sm" onClick={() => setAnchor(addDays(weekStart, 7))}>Sljedeći tjedan →</button>
        </div>
      </div>

      {lowBalanceClients.length > 0 && (
        <div className="card" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
          <h3>⚠️ Potrebna uplata</h3>
          <div className="flex" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            {lowBalanceClients.map(({ client, balance }) => (
              <Link key={client.id} to={`/klijenti/${client.id}`} className="badge badge-amber">
                {client.name}: {balance.remaining <= 0 ? "iskorišteno" : `${balance.remaining} dolazaka`}
              </Link>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="card empty-state">
          Nema klijenata. <Link to="/klijenti">Dodaj prvog klijenta</Link> pa mu postavi tjedni raspored.
        </div>
      ) : (
        <div className="week-grid">
          {weekDates.map(({ date, weekday, iso }) => {
            const planned = plannedForDay(iso, weekday);
            const extra = extraForDay(iso);
            return (
              <div className={"day-col" + (isToday(iso) ? " today" : "")} key={iso}>
                <div className="day-header">
                  <span>{WEEKDAY_LABELS[weekday].slice(0, 3)}</span>
                  <span className="date-num">{format(date, "d.M.")}</span>
                </div>

                {planned.length === 0 && extra.length === 0 && (
                  <div className="text-muted" style={{ fontSize: "0.78rem" }}>—</div>
                )}

                {planned.map((item) => {
                  const client = clientById.get(item.clientId);
                  return (
                    <div className="session-item" key={item.slotId + item.iso}>
                      <div>
                        <span className="time">{item.time}</span> · {client?.name ?? "?"}
                      </div>
                      {item.record ? (
                        <div style={{ marginTop: "0.25rem" }}>
                          <span className={"badge " + statusBadgeClass(item.record.status)}>
                            {STATUS_LABELS[item.record.status]}
                          </span>{" "}
                          <button className="btn btn-sm" style={{ marginLeft: "0.25rem" }} onClick={() => unmark(item.record!)}>
                            poništi
                          </button>
                        </div>
                      ) : (
                        <div className="session-actions">
                          {STATUS_BUTTONS.map((b) => (
                            <button key={b.status} className={"btn btn-sm " + b.cls} onClick={() => markStatus(item, b.status)}>
                              {b.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {!item.record && isPast(iso, item.time) && (
                        <div className="text-muted" style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
                          nije označeno
                        </div>
                      )}
                    </div>
                  );
                })}

                {extra.map((record) => {
                  const client = clientById.get(record.clientId);
                  return (
                    <div className="session-item" key={"extra-" + record.id}>
                      <div>
                        <span className="time">{record.time}</span> · {client?.name ?? "?"} <span className="text-muted">(izvanredno)</span>
                      </div>
                      <div style={{ marginTop: "0.25rem" }}>
                        <span className={"badge " + statusBadgeClass(record.status)}>{STATUS_LABELS[record.status]}</span>{" "}
                        <button className="btn btn-sm" style={{ marginLeft: "0.25rem" }} onClick={() => unmark(record)}>
                          obriši
                        </button>
                      </div>
                      <div className="session-actions">
                        {STATUS_BUTTONS.filter((b) => b.status !== record.status).map((b) => (
                          <button key={b.status} className={"btn btn-sm " + b.cls} onClick={() => markExtraStatus(record, b.status)}>
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {addFormDay === iso ? (
                  <AddExtraForm clients={clients} onCancel={() => setAddFormDay(null)} onSubmit={(clientId, time) => addExtraSession(iso, clientId, time)} />
                ) : (
                  <button className="btn btn-sm btn-gray" onClick={() => setAddFormDay(iso)} style={{ width: "100%", marginTop: "0.25rem" }}>
                    + izvanredni termin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusBadgeClass(status: SessionStatus): string {
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

function AddExtraForm({
  clients,
  onSubmit,
  onCancel,
}: {
  clients: Client[];
  onSubmit: (clientId: number, time: string) => void;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState<number | "">("");
  const [time, setTime] = useState("18:00");
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <select value={clientId} onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")} style={{ marginBottom: "0.3rem" }}>
        <option value="">Klijent…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ marginBottom: "0.3rem" }} />
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-primary"
          disabled={!clientId}
          onClick={() => clientId && onSubmit(clientId, time)}
        >
          Dodaj
        </button>
        <button className="btn btn-sm" onClick={onCancel}>
          Odustani
        </button>
      </div>
    </div>
  );
}

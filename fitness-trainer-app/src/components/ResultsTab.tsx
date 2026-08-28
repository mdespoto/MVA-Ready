import { useEffect, useState } from "react";
import { db } from "../db";
import type { Measurement, NutritionNote } from "../types";
import { isoDate } from "../utils/week";

export default function ResultsTab({ clientId }: { clientId: number }) {
  return (
    <div>
      <MeasurementsCard clientId={clientId} />
      <NutritionCard clientId={clientId} />
    </div>
  );
}

const MEASUREMENT_FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
  { key: "weightKg", label: "Težina", unit: "kg" },
  { key: "waistCm", label: "Struk", unit: "cm" },
  { key: "chestCm", label: "Grudi", unit: "cm" },
  { key: "hipsCm", label: "Bokovi", unit: "cm" },
  { key: "armCm", label: "Nadlaktica", unit: "cm" },
  { key: "thighCm", label: "Bedro", unit: "cm" },
  { key: "bodyFatPct", label: "% masti", unit: "%" },
];

function MeasurementsCard({ clientId }: { clientId: number }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(isoDate(new Date()));
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  async function load() {
    const m = await db.measurements.where("clientId").equals(clientId).toArray();
    m.sort((a, b) => b.date.localeCompare(a.date));
    setMeasurements(m);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function addMeasurement() {
    const entry: Measurement = { clientId, date, note };
    for (const f of MEASUREMENT_FIELDS) {
      const raw = values[f.key as string];
      if (raw) (entry as any)[f.key] = Number(raw);
    }
    await db.measurements.add(entry);
    setValues({});
    setNote("");
    setShowForm(false);
    load();
  }

  async function remove(m: Measurement) {
    await db.measurements.delete(m.id!);
    load();
  }

  return (
    <div className="card">
      <div className="flex-between">
        <h3>Mjere</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Zatvori" : "+ Novo mjerenje"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <div className="form-row">
            <label>Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
          <div className="form-grid">
            {MEASUREMENT_FIELDS.map((f) => (
              <div className="form-row" key={f.key as string}>
                <label>
                  {f.label} ({f.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={values[f.key as string] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key as string]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="form-row">
            <label>Napomena</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={addMeasurement}>
            Spremi mjerenje
          </button>
        </div>
      )}

      {measurements.length === 0 ? (
        <div className="empty-state">Još nema unesenih mjerenja.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                {MEASUREMENT_FIELDS.map((f) => (
                  <th key={f.key as string}>{f.label}</th>
                ))}
                <th>Napomena</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.date)}</td>
                  {MEASUREMENT_FIELDS.map((f) => (
                    <td key={f.key as string}>{(m as any)[f.key] ?? "—"}</td>
                  ))}
                  <td className="text-muted">{m.note || "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-red" onClick={() => remove(m)}>
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NutritionCard({ clientId }: { clientId: number }) {
  const [notes, setNotes] = useState<NutritionNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(isoDate(new Date()));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    const n = await db.nutritionNotes.where("clientId").equals(clientId).toArray();
    n.sort((a, b) => b.date.localeCompare(a.date));
    setNotes(n);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function addNote() {
    if (!title.trim()) return;
    await db.nutritionNotes.add({ clientId, date, title: title.trim(), content });
    setTitle("");
    setContent("");
    setShowForm(false);
    load();
  }

  async function remove(n: NutritionNote) {
    await db.nutritionNotes.delete(n.id!);
    load();
  }

  return (
    <div className="card">
      <div className="flex-between">
        <h3>Prehrana</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Zatvori" : "+ Nova napomena"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <div className="form-grid">
            <div className="form-row">
              <label>Datum</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Naslov</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="npr. plan prehrane - kolovoz" />
            </div>
          </div>
          <div className="form-row">
            <label>Sadržaj</label>
            <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={addNote} disabled={!title.trim()}>
            Spremi napomenu
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="empty-state">Još nema napomena o prehrani.</div>
      ) : (
        <div>
          {notes.map((n) => (
            <div key={n.id} className="session-item" style={{ marginBottom: "0.75rem" }}>
              <div className="flex-between">
                <strong>{n.title}</strong>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {formatDate(n.date)}
                </span>
              </div>
              {n.content && <div style={{ whiteSpace: "pre-wrap", marginTop: "0.3rem" }}>{n.content}</div>}
              <button className="btn btn-sm btn-red" style={{ marginTop: "0.4rem" }} onClick={() => remove(n)}>
                Obriši
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}.`;
}

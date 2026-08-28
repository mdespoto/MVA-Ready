import Dexie, { type Table } from "dexie";
import type {
  Client,
  ScheduleSlot,
  SessionRecord,
  Payment,
  Measurement,
  NutritionNote,
} from "./types";

class TrainerDB extends Dexie {
  clients!: Table<Client, number>;
  scheduleSlots!: Table<ScheduleSlot, number>;
  sessions!: Table<SessionRecord, number>;
  payments!: Table<Payment, number>;
  measurements!: Table<Measurement, number>;
  nutritionNotes!: Table<NutritionNote, number>;

  constructor() {
    super("fitness-trainer-db");
    this.version(1).stores({
      clients: "++id, name, active",
      scheduleSlots: "++id, clientId, weekday, active",
      sessions: "++id, clientId, date, [clientId+date], status",
      payments: "++id, clientId, date",
      measurements: "++id, clientId, date",
      nutritionNotes: "++id, clientId, date",
    });
  }
}

export const db = new TrainerDB();

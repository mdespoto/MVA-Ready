export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = ponedjeljak ... 6 = nedjelja

export interface Client {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  active: boolean;
  createdAt: string; // ISO date
}

export interface ScheduleSlot {
  id?: number;
  clientId: number;
  weekday: Weekday;
  time: string; // "HH:mm"
  active: boolean;
}

export type SessionStatus =
  | "attended" // odrađano
  | "cancelled_ontime" // otkazano na vrijeme - ne ide na paket
  | "cancelled_late" // otkazano kasno - ide na paket
  | "no_show"; // nije se pojavio/la - ide na paket

export interface SessionRecord {
  id?: number;
  clientId: number;
  date: string; // ISO date (yyyy-MM-dd)
  time: string; // "HH:mm"
  status: SessionStatus;
  countsAgainstPackage: boolean;
  note?: string;
  slotId?: number;
}

export interface Payment {
  id?: number;
  clientId: number;
  date: string; // ISO date
  amount: number;
  sessionsIncluded: number;
  note?: string;
}

export interface Measurement {
  id?: number;
  clientId: number;
  date: string; // ISO date
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPct?: number;
  note?: string;
}

export interface NutritionNote {
  id?: number;
  clientId: number;
  date: string; // ISO date
  title: string;
  content: string;
}

export const STATUS_LABELS: Record<SessionStatus, string> = {
  attended: "Odrađano",
  cancelled_ontime: "Otkazano na vrijeme",
  cancelled_late: "Otkazano kasno",
  no_show: "Nije se pojavio/la",
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Ponedjeljak",
  1: "Utorak",
  2: "Srijeda",
  3: "Četvrtak",
  4: "Petak",
  5: "Subota",
  6: "Nedjelja",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: "Pon",
  1: "Uto",
  2: "Sri",
  3: "Čet",
  4: "Pet",
  5: "Sub",
  6: "Ned",
};

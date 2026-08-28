import { addDays, format, startOfWeek } from "date-fns";
import type { Weekday } from "../types";

// Week starts Monday (weekday 0)
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDates(weekStart: Date): { date: Date; weekday: Weekday; iso: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: d, weekday: i as Weekday, iso: format(d, "yyyy-MM-dd") };
  });
}

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function isPast(iso: string, time: string): boolean {
  const dt = new Date(`${iso}T${time}:00`);
  return dt.getTime() < Date.now();
}

export function isToday(iso: string): boolean {
  return iso === isoDate(new Date());
}

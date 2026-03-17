import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BADGE_COLORS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function badgeColorFor(section: string | undefined, sections: string[]) {
  if (!section) return "bg-secondary text-secondary-foreground";
  const i = sections.indexOf(section);
  return i >= 0
    ? BADGE_COLORS[i % BADGE_COLORS.length]
    : "bg-secondary text-secondary-foreground";
}

export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

export type ScheduleDayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export function dayKeyFromDate(d: Date): ScheduleDayKey {
  const day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

  // Sunday is not scheduled in this app.
  // We return "Mon" only as a safe fallback.
  if (day === 0) return "Mon";

  return KEYS[day - 1];
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isHoliday(d: Date, list: Date[] = []) {
  return list.some((h) => sameDay(h, d));
}

export function startOfWeekMonday(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift so Monday is start
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
export function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

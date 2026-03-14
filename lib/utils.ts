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

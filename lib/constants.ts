export const BADGE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-lime-100 text-lime-700",
  "bg-orange-100 text-orange-700",
];

export const emptySchedule = (): ScheduleByDay => ({
  Mon: {},
  Tue: {},
  Wed: {},
  Thu: {},
  Fri: {},
  Sat: {},
});

export type ScheduleByDay = Record<WeekdayKey, DayPeriods>;

export type WeekdayKey = (typeof weekdays)[number];

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type DayPeriods = Record<number, string | undefined>;

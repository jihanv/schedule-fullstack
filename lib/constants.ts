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
import { Alignment } from "exceljs";

export const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const WEEKDAY_LABELS = {
  en: {
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
    Sun: "Sun",
  },
  ja: {
    Mon: "月",
    Tue: "火",
    Wed: "水",
    Thu: "木",
    Fri: "金",
    Sat: "土",
    Sun: "日",
  },
} as const;
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

export const EXCEL_BADGE_PALETTE: Array<{ fill: string; font: string }> = [
  { fill: "FFFDE68A", font: "FF78350F" }, // amber-200 / amber-900
  { fill: "FFA7F3D0", font: "FF064E3B" }, // emerald-200 / emerald-900
  { fill: "FFBFDBFE", font: "FF1E3A8A" }, // blue-200 / blue-900
  { fill: "FFE9D5FF", font: "FF4C1D95" }, // purple-200 / purple-900
  { fill: "FFFECACA", font: "FF7F1D1D" }, // red-200 / red-900
  { fill: "FFD1FAE5", font: "FF065F46" }, // emerald-200-ish / teal-900
  { fill: "FFFDE68A", font: "FF92400E" }, // amber-200 / amber-800
  { fill: "FFD9F99D", font: "FF365314" }, // lime-200 / lime-900
];

export const HOLIDAY_FILL = "FFF3F4F6";
export const HOLIDAY_FONT = "FF6B7280";
export const ROW_HEIGHT_4_LINES = 50;

export const ALIGN_CENTER_MULTI: Readonly<Partial<Alignment>> = {
  vertical: "middle",
  horizontal: "center",
  wrapText: true,
} as const;

export const ALIGN_CENTER_ONE: Readonly<Partial<Alignment>> = {
  vertical: "middle",
  horizontal: "center",
  wrapText: false,
} as const;

export type Slot = { date: Date; period: number; section: string };

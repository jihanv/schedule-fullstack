import { create } from "zustand";
import {
  startOfDay,
  isAfter,
  isBefore,
  addDays,
  min as minDate,
  max as maxDate,
} from "date-fns";
import { emptySchedule, ScheduleByDay, WeekdayKey } from "@/lib/constants";

type TimePeriodStore = {
  activateNext: boolean;
  setActivateNext: (activated: boolean) => void;

  //Date
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;

  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;

  //Holidays
  showHolidaySelector: boolean;
  setShowHolidaySelector: () => void;

  holidays: Date[];
  setHolidays: (dates: Date[]) => void;

  pendingHolidays: Date[];
  setPendingHolidays: (dates: Date[]) => void;

  commitPendingHolidays: () => void;

  noHolidays: boolean;
  setNoHolidays: (withoutHoliday: boolean) => void;

  //Section names
  sections: string[];
  addSections: (section: string) => boolean;
  removeSection: (section: string) => void;

  // Periods
  setSectionForPeriod: (
    day: WeekdayKey,
    period: number,
    section: string | null,
  ) => void;
  clearPeriod: (day: WeekdayKey, period: number) => void;
  //
  schedule: ScheduleByDay;
};

export const useTimePeriodStore = create<TimePeriodStore>((set, get) => ({
  activateNext: false,
  setActivateNext: (activated: boolean) =>
    set(() => ({
      activateNext: activated,
    })),

  startDate: undefined,

  setStartDate: (date) =>
    set((state) => {
      if (!date) {
        state.setActivateNext(false);
        return { startDate: undefined, endDate: undefined };
      }

      const sd = startOfDay(date);

      let nextEnd = state.endDate ? startOfDay(state.endDate) : undefined;

      // keep end within [start, start + 183]
      if (nextEnd) {
        const maxEnd = addDays(sd, 183);
        if (isBefore(nextEnd, sd)) nextEnd = sd;
        if (isAfter(nextEnd, maxEnd)) nextEnd = maxEnd;
      }

      return { startDate: sd, endDate: nextEnd };
    }),

  endDate: undefined,
  setEndDate: (date) =>
    set((state) => {
      if (!date) {
        state.setActivateNext(false);
        return { endDate: undefined };
      }
      const ed = startOfDay(date);
      const sd = state.startDate ? startOfDay(state.startDate) : undefined;

      if (!sd) {
        // no startDate set yet — just store normalized endDate
        return { endDate: ed };
      }

      // clamp to [sd, sd + 183]
      const maxEnd = addDays(sd, 183);
      let clamped = ed;
      if (isBefore(clamped, sd)) clamped = sd;
      if (isAfter(clamped, maxEnd)) clamped = maxEnd;

      return { endDate: clamped };
    }),

  showHolidaySelector: true,
  setShowHolidaySelector: () =>
    set((state) => ({
      showHolidaySelector: !state.showHolidaySelector,
    })),

  holidays: [],

  setHolidays: (dates) =>
    set((state) => {
      const { startDate, endDate } = state;

      // 1) normalize
      const normalized = (dates ?? [])
        .filter(Boolean)
        .map((d) => startOfDay(d));

      // 2) ensures that even if something outside the range sneaks in (e.g. a user clicks an invalid date in the calendar, or data comes from an import), it will be filtered out
      const clamped =
        startDate && endDate
          ? normalized.filter((d) => {
              const minD = startOfDay(minDate([startDate, endDate]));
              const maxD = startOfDay(maxDate([startDate, endDate]));
              return !isBefore(d, minD) && !isAfter(d, maxD);
            })
          : normalized;

      // 3) Make sure you don’t end up with the same holiday multiple times.
      const unique = Array.from(
        new Map(clamped.map((d) => [d.getTime(), d])).values(),
      );

      // 4) sort ascending
      unique.sort((a, b) => a.getTime() - b.getTime());

      return { holidays: unique };
    }),

  pendingHolidays: [],
  setPendingHolidays: (dates) => set({ pendingHolidays: dates }),
  commitPendingHolidays: () => {
    const { pendingHolidays, setHolidays } = get();
    // reuse your existing normalization/dedupe/clamp in setHolidays
    setHolidays(pendingHolidays);
  },
  noHolidays: false,
  setNoHolidays: (withoutHoliday: boolean) =>
    set(() => ({
      noHolidays: withoutHoliday,
    })),

  sections: [],
  addSections: (section) => {
    const s = section.trim();
    const { sections } = get();
    if (!s || sections.includes(s) || sections.length >= 10) return false;
    set({ sections: [...sections, s] });
    return true;
  },
  removeSection: (section) =>
    set((state) => {
      const nextSections = state.sections.filter((s) => s !== section);

      // scrub this section from every day/period cell
      const nextSchedule = { ...state.schedule };
      for (const day of Object.keys(
        nextSchedule,
      ) as (keyof typeof nextSchedule)[]) {
        const dayMap = { ...(nextSchedule[day] ?? {}) };
        for (const p of Object.keys(dayMap)) {
          if (dayMap[Number(p)] === section) delete dayMap[Number(p)];
        }
        nextSchedule[day] = dayMap;
      }

      // if no sections left → full reset
      if (nextSections.length === 0) {
        return {
          sections: [],
          schedule: emptySchedule(),
        };
      }

      return { sections: nextSections, schedule: nextSchedule };
    }),
  schedule: emptySchedule(),

  setSectionForPeriod: (day, period, section) =>
    set((state) => {
      // optional guard: only allow known sections
      if (section && !state.sections.includes(section)) {
        return {}; // ignore invalid section
      }

      const dayMap = { ...(state.schedule[day] ?? {}) };
      if (section === null) {
        delete dayMap[period];
      } else {
        dayMap[period] = section;
      }

      return {
        schedule: {
          ...state.schedule,
          [day]: dayMap,
        },
      };
    }),

  clearPeriod: (day, period) =>
    set((state) => {
      const dayMap = { ...(state.schedule[day] ?? {}) };
      delete dayMap[period];
      return { schedule: { ...state.schedule, [day]: dayMap } };
    }),
}));

import { create } from "zustand";
import { startOfDay, isAfter, isBefore, addDays } from "date-fns";

type TimePeriodStore = {
  activateNext: boolean;
  setActivateNext: (activated: boolean) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;

  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
};

export const useTimePeriodStore = create<TimePeriodStore>((set) => ({
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
}));

import { create } from "zustand";

export type Steps = 1 | 2 | 3 | 4 | 5 | 6;
export type NavigationStore = {
  step: Steps;
  setSteps: (step: Steps) => void;
};

export const useNavigationStore = create<NavigationStore>((set) => ({
  step: 1,
  setSteps: (step: Steps) => {
    set({ step });
  },
}));

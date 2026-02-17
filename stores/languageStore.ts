import { create } from "zustand";

// Types
export type Language = "english" | "japanese";
type NavigatorWithUserLanguage = Navigator & { userLanguage?: string };

// Helper functions
export function detectBrowserLanguage(): Language {
  if (typeof navigator !== "undefined") {
    const nav = navigator as NavigatorWithUserLanguage;
    const lang = nav.language || nav.userLanguage;
    if (lang && lang.toLowerCase().startsWith("ja")) return "japanese";
  }
  return "english";
}

type LanguageStore = {
  uiLanguage: Language;
  initialized: boolean; // <-- add
  setUiLanguage: (language: Language) => void;
  initUiLanguage: () => void; // <-- add
};

export const useLanguage = create<LanguageStore>((set, get) => ({
  uiLanguage: "english",
  initialized: false,

  initUiLanguage: () => {
    if (get().initialized) return;
    set({ uiLanguage: detectBrowserLanguage(), initialized: true });
  },

  setUiLanguage: (language) => {
    set({ uiLanguage: language, initialized: true });
  },
}));

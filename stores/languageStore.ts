import { create } from "zustand";

// Types
type Language = "english" | "japanese";
type NavigatorWithUserLanguage = Navigator & { userLanguage?: string };

// Helper functions
function detectBrowserLanguage(): Language {
  if (typeof navigator !== "undefined") {
    const nav = navigator as NavigatorWithUserLanguage;
    const lang = nav.language || nav.userLanguage;
    if (lang && lang.toLowerCase().startsWith("ja")) {
      return "japanese";
    }
  }
  return "english";
}

export type LanguageStore = {
  uiLanguage: Language;
  setUiLanguage: (language: Language) => void;
};

export const useLanguage = create<LanguageStore>((set) => ({
  uiLanguage: detectBrowserLanguage(),
  setUiLanguage: (language) => {
    set(() => ({
      uiLanguage: language,
    }));
  },
}));

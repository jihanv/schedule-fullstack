"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Locale = "en" | "ja";

function isLocale(value: string): value is Locale {
  return value === "en" || value === "ja";
}

export default function LanguageInput() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function changeLocale(nextLocale: string) {
    if (!isLocale(nextLocale)) return;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="px-6 pb-4 pt-2">
      <div className="grid grid-cols-2 rounded-xl bg-slate-200 p-1 shadow-inner dark:bg-slate-800">
        <button
          type="button"
          onClick={() => changeLocale("ja")}
          aria-pressed={locale === "ja"}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === "ja"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
        >
          日本語
        </button>

        <button
          type="button"
          onClick={() => changeLocale("en")}
          aria-pressed={locale === "en"}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === "en"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
        >
          English
        </button>
      </div>
    </div>
  );
}
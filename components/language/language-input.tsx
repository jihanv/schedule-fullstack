"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

type Locale = "en" | "ja";

function isLocale(value: string): value is Locale {
    return value === "en" || value === "ja";
}

export default function LanguageInput() {
    const locale = useLocale();
    const pathname = usePathname(); // NOTE: this is WITHOUT the locale prefix :contentReference[oaicite:1]{index=1}
    const router = useRouter();

    return (
        <div className="pl-6 pb-4">
            <Tabs
                value={locale}
                onValueChange={(nextLocale) => {
                    if (!isLocale(nextLocale)) return;

                    // Switch locale but stay on the same page :contentReference[oaicite:2]{index=2}
                    router.replace(pathname, { locale: nextLocale });
                }}
            >
                <TabsList className="rounded-full bg-gray-300 p-1 shadow-inner">
                    <TabsTrigger
                        value="ja"
                        className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow"
                    >
                        日本語
                    </TabsTrigger>

                    <TabsTrigger
                        value="en"
                        className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow"
                    >
                        English
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
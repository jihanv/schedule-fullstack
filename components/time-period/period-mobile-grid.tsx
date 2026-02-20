"use client";

import { useEffect, useMemo, useState } from "react";
import { PERIODS, BADGE_COLORS } from "@/lib/constants";
import { WeekdayKey } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLocale, useTranslations } from "next-intl";
import { getDisplayWeekdays } from "./period-grid";

export default function PeriodGridMobile() {

    const schedule = useTimePeriodStore((s) => s.schedule);
    const sections = useTimePeriodStore((s) => s.sections);

    const t = useTranslations("PeriodGridMobile");
    const setActivateNext = useTimePeriodStore((s) => s.setActivateNext);

    const badgeColorFor = (section?: string) => {
        if (!section) return "bg-secondary text-secondary-foreground";
        const i = sections.indexOf(section);
        return i >= 0
            ? BADGE_COLORS[i % BADGE_COLORS.length]
            : "bg-secondary text-secondary-foreground";
    };

    const setSectionForPeriod = useTimePeriodStore((s) => s.setSectionForPeriod);
    const clearPeriod = useTimePeriodStore((s) => s.clearPeriod);
    const locale = useLocale();
    const uiLocale = locale === 'ja' ? 'ja' : 'en'; // fallback to 'en'
    const displayWeekdays = getDisplayWeekdays(uiLocale);
    const [activeDay, setActiveDay] = useState<WeekdayKey>(
        displayWeekdays[0].key as WeekdayKey,
    );

    const [openPeriod, setOpenPeriod] = useState<number | null>(null);

    const hasAny = useMemo(
        () =>
            Object.values(schedule).some((day) => Object.keys(day ?? {}).length > 0),
        [schedule],
    );

    useEffect(() => {
        setActivateNext(hasAny);
    }, [hasAny, setActivateNext]);

    const assigned =
        openPeriod != null ? schedule[activeDay]?.[openPeriod] : undefined;

    return (
        <div className="space-y-3 items-center">
            <div className="flex flex-col">
                <Tabs
                    value={activeDay}
                    onValueChange={(v) => setActiveDay(v as WeekdayKey)}


                >
                    <TabsList className="w-full grid grid-cols-6 h-12">
                        {displayWeekdays.map(({ key, label }) => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="
                                    text-sm p-0 h-full leading-none
                                    data-[state=active]:bg-accent-foreground
                                    data-[state=active]:text-white
                                "

                            >
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Weekday switcher */}

            {/* Period list */}
            <div className="space-y-2">
                {PERIODS.map((p) => {
                    const value = schedule[activeDay]?.[p];
                    const colored = value ? badgeColorFor(value) : "bg-card";

                    return (
                        <button
                            key={p}
                            className={`w-full rounded-xl border p-2 text-left transition-colors ${colored}`}
                            onClick={() => setOpenPeriod(p)}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex flex-row gap-2">
                                    <p className="text-3xl">
                                        {displayWeekdays.find((d) => d.key === activeDay)?.label ??
                                            String(activeDay)}
                                    </p>
                                    <div className="flex flex-col">
                                        <div className="text-sm font-medium">
                                            {t("periodLabel", { period: p })}
                                        </div>

                                        <div
                                            className={`text-sm truncate ${value ? "opacity-90" : "text-muted-foreground"
                                                }`}
                                        >
                                            {value ??
                                                t("notSet")}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`shrink-0 text-xs ${value ? "opacity-80" : "text-muted-foreground"}`}
                                >
                                    {t("edit")}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom sheet picker */}
            <Drawer
                open={openPeriod != null}
                onOpenChange={(o) => !o && setOpenPeriod(null)}
            >
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>
                            {openPeriod != null
                                ? t("drawerTitle", { day: activeDay, period: openPeriod })
                                : ""}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 pt-0 space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            disabled={openPeriod == null || !assigned}
                            onClick={() => {
                                if (openPeriod == null) return;
                                clearPeriod(activeDay, openPeriod);
                                setOpenPeriod(null);
                            }}
                        >
                            {t("clear")}
                        </Button>

                        <div className="space-y-2">
                            {sections.map((name) => (
                                <Button
                                    key={name}
                                    variant={name === assigned ? "default" : "outline"}
                                    className="w-full justify-start"
                                    onClick={() => {
                                        if (openPeriod == null) return;
                                        setSectionForPeriod(activeDay, openPeriod, name);
                                        setOpenPeriod(null);
                                    }}
                                >
                                    {name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

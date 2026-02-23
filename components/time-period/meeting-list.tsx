"use client";

import React from "react";
import { PERIODS } from "@/lib/constants";
import H1 from "@/components/format/h1";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLocale, useTranslations } from "next-intl";

function dayKeyFromDate(
    d: Date,
): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" {
    const day = d.getDay(); // 0=Sun..6=Sat
    const KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    if (day === 0) return "Mon"; // we never schedule Sunday; safe fallback
    return KEYS[day - 1];
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isHoliday(d: Date, holidays: Date[]) {
    return holidays?.some((h) => sameDay(h, d));
}

export default function MeetingListEditor() {
    const {
        startDate,
        endDate,
        schedule,
        sections,
        pendingHolidays,
        deletedLessons,
    } = useTimePeriodStore();
    function toDateKey(d: Date) {
        return format(d, "yyyy-MM-dd");
    }
    const locale = useLocale();
    const uiLocale = locale === 'ja' ? 'ja' : 'en';
    const t = useTranslations("MeetingList")
    const { perSectionCounts, perSectionMeetings } = React.useMemo(() => {
        // If we don’t have the basics, return empty results
        if (!startDate || !endDate || sections.length === 0) {
            return {
                perSectionCounts: new Map<string, number>(),
                perSectionMeetings: new Map<
                    string,
                    { date: Date; period: number; meetingNumber: number }[]
                >(),
                maxMeetings: 0,
            };
        }

        // 1) Walk every day in the chosen range
        const rawSlots: { date: Date; period: number; section: string }[] = [];
        const cur = new Date(startDate);
        const end = new Date(endDate);

        while (cur <= end) {
            const isSunday = cur.getDay() === 0;
            if (!isSunday && !isHoliday(cur, pendingHolidays)) {
                const key = dayKeyFromDate(cur);
                for (const p of PERIODS) {
                    const assigned = schedule[key]?.[p];

                    if (!assigned) continue;

                    const dateKey = toDateKey(cur);

                    const isDeleted = deletedLessons.some(
                        (x) => x.dateKey === dateKey && x.period === p
                    );

                    if (isDeleted) continue;

                    rawSlots.push({
                        date: new Date(cur),
                        period: p,
                        section: assigned,
                    });

                }
            }
            cur.setDate(cur.getDate() + 1);
        }

        // 2) Sort strictly by date, then by period (chronological)
        rawSlots.sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.period - b.period,
        );

        // 3) Build per-section running counts + lists
        const perSectionCounts = new Map<string, number>();
        const perSectionMeetings = new Map<
            string,
            { date: Date; period: number; meetingNumber: number }[]
        >();
        const counters = new Map<string, number>(); // section -> next meeting number

        // initialize for all sections so empty ones still render “0”
        for (const s of sections) {
            perSectionCounts.set(s, 0);
            perSectionMeetings.set(s, []);
            counters.set(s, 0);
        }

        for (const slot of rawSlots) {
            const next = (counters.get(slot.section) ?? 0) + 1;
            counters.set(slot.section, next);

            if (!sections.includes(slot.section)) continue;

            perSectionCounts.set(
                slot.section,
                (perSectionCounts.get(slot.section) ?? 0) + 1,
            );

            if (!perSectionMeetings.has(slot.section)) {
                perSectionMeetings.set(slot.section, []);
            }
            perSectionMeetings.get(slot.section)!.push({
                date: slot.date,
                period: slot.period,
                meetingNumber: next,
            });
        }

        // 4) find the maximum to show “Max = …”
        let max = 0;
        for (const [, n] of perSectionCounts) if (n > max) max = n;

        return { perSectionCounts, perSectionMeetings, maxMeetings: max };
    }, [startDate, endDate, sections, schedule, pendingHolidays, deletedLessons]);
    //   const items = useMemo(
    //     () => Array.from({ length: maxMeetings }, (_, i) => i + 1),
    //     [maxMeetings],
    //   );

    return (
        <div className="p-10 items-center flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <H1>{t("title")}</H1>
            </div>

            {/* Per-section summary */}
            {/* Per-section summary (one per line) */}
            {sections.length > 0 && (
                <ul className="mb-3 pt-2 sm:grid sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-md font-bold">
                    {sections.map((s) => {
                        const n = perSectionCounts.get(s) ?? 0;
                        return (
                            <li key={s} className="contents">
                                <span className="shrink-0 self-center text-[15px] font-medium">
                                    {s}:
                                </span>
                                <div className="self-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="default"
                                                className="sm:w-45 w-55  sm:font-medium"
                                            >
                                                {t("viewAllDates", { count: n })}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-72" align="start">
                                            {(perSectionCounts.get(s) ?? 0) === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    No meetings for this section.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-semibold">
                                                        {t("sectionHeading", { section: s })}
                                                    </div>
                                                    <ul className="space-y-1 max-h-60 overflow-auto pr-1">
                                                        {perSectionMeetings.get(s)!.map((m) => (
                                                            <li
                                                                key={`${s}-${m.meetingNumber}-${m.date.toISOString()}-${m.period}`}
                                                            >
                                                                <div className="text-sm leading-tight">
                                                                    <div className="font-medium">
                                                                        {t("lessonNumber", { number: m.meetingNumber })}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {uiLocale === "en"
                                                                            ? format(m.date, "yyyy-MM-dd (EEE)")
                                                                            : format(m.date, "yyyy-MM-dd (EEE)", {
                                                                                locale: ja,
                                                                            })}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

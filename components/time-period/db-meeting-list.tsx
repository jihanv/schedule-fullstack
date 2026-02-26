"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import H1 from "@/components/format/h1";

type Lesson = {
    lesson_id: string;
    lessonNumber: number;
    lessonDate: string | Date; // drizzle date may be string or Date depending on config
    timeSlot: number;
};

type CourseWithLessons = {
    course_id: string;
    courseName: string;
    lessons: Lesson[];
};

function toLocalDate(date: string | Date): Date {
    if (date instanceof Date) return date;
    // IMPORTANT: avoid new Date("YYYY-MM-DD") (it parses as UTC and can shift day)
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function MeetingListFromDb({ courses }: { courses: CourseWithLessons[] }) {
    const t = useTranslations("MeetingList");
    const locale = useLocale();
    const uiLocale = locale === "ja" ? "ja" : "en";

    const { sections, perSectionCounts, perSectionMeetings } = React.useMemo(() => {
        const sections = courses.map((c) => c.courseName);

        const perSectionCounts = new Map<string, number>();
        const perSectionMeetings = new Map<
            string,
            { date: Date; period: number; meetingNumber: number }[]
        >();

        for (const c of courses) {
            const sorted = [...(c.lessons ?? [])].sort((a, b) => {
                const da = a.lessonDate instanceof Date ? format(a.lessonDate, "yyyy-MM-dd") : a.lessonDate;
                const db = b.lessonDate instanceof Date ? format(b.lessonDate, "yyyy-MM-dd") : b.lessonDate;
                return da.localeCompare(db) || a.timeSlot - b.timeSlot || a.lessonNumber - b.lessonNumber;
            });

            perSectionCounts.set(c.courseName, sorted.length);
            perSectionMeetings.set(
                c.courseName,
                sorted.map((l) => ({
                    date: toLocalDate(l.lessonDate),
                    period: l.timeSlot,
                    meetingNumber: l.lessonNumber,
                })),
            );
        }

        return { sections, perSectionCounts, perSectionMeetings };
    }, [courses]);

    return (
        <div className="p-10 items-center flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <H1>{t("title")}</H1>
            </div>

            {sections.length > 0 && (
                <ul className="mb-3 pt-2 sm:grid sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-md font-bold">
                    {sections.map((s) => {
                        const n = perSectionCounts.get(s) ?? 0;
                        return (
                            <li key={s} className="contents">
                                <span className="shrink-0 self-center text-[15px] font-medium">{s}:</span>

                                <div className="self-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button className="sm:w-45 w-55 sm:font-medium">
                                                {t("viewAllDates", { count: n })}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-72" align="start">
                                            {n === 0 ? (
                                                <p className="text-sm text-muted-foreground">No meetings for this section.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-semibold">
                                                        {t("sectionHeading", { section: s })}
                                                    </div>

                                                    <ul className="space-y-1 max-h-60 overflow-auto pr-1">
                                                        {(perSectionMeetings.get(s) ?? []).map((m) => (
                                                            <li key={`${s}-${m.meetingNumber}-${m.date.toISOString()}-${m.period}`}>
                                                                <div className="text-sm leading-tight">
                                                                    <div className="font-medium">
                                                                        {t("lessonNumber", { number: m.meetingNumber })}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {uiLocale === "en"
                                                                            ? format(m.date, "yyyy-MM-dd (EEE)")
                                                                            : format(m.date, "yyyy-MM-dd (EEE)", { locale: ja })}

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
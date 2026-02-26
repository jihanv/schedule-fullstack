// app/dashboard/timeperiod/saved/[periodId]/SavedWeekPager.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BADGE_COLORS } from "@/lib/constants";

const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;
function makeCourseColorMap(
    courseNames: string[],
    palette: string[],
): Map<string, string> {
    const unique = Array.from(new Set(courseNames));
    unique.sort(); // stable across renders
    const map = new Map<string, string>();
    unique.forEach((name, i) => map.set(name, palette[i % palette.length]));
    return map;
}
function parseYmdLocal(ymd: string): Date {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function ymdFromLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function startOfWeekMonday(d: Date) {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
function addDays(d: Date, days: number) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}
function buildWeekStarts(periodStart: Date, periodEnd: Date) {
    const starts: Date[] = [];
    let cur = startOfWeekMonday(periodStart);
    while (cur <= periodEnd) {
        const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(cur, i));
        if (days.some((x) => x >= periodStart && x <= periodEnd)) starts.push(new Date(cur));
        cur = addDays(cur, 7);
    }
    return starts;
}

type Data = {
    ok: true;
    period: { periodId: string; startDate: string; endDate: string };
    courses: { course_id: string; courseName: string }[];
    holidays: { holidayDate: string; holidayName: string | null }[];
    lessons: {
        lesson_id: string;
        lessonDate: string;
        timeSlot: number;
        lessonNumber: number;
        course_id: string;
        courseName: string;
    }[];
};

export default function SavedWeekPager({ data }: { data: Data }) {
    const courseColorMap = useMemo(() => {
        const names = data.courses.map((c) => c.courseName);
        return makeCourseColorMap(names, BADGE_COLORS);
    }, [data.courses]);
    const periodStart = useMemo(
        () => parseYmdLocal(data.period.startDate),
        [data.period.startDate],
    );
    const periodEnd = useMemo(
        () => parseYmdLocal(data.period.endDate),
        [data.period.endDate],
    );
    function formatRange(weekStart: Date) {
        const start = weekStart;
        const end = addDays(weekStart, 5); // Mon..Sat
        return `${ymdFromLocalDate(start)} → ${ymdFromLocalDate(end)}`;
    }
    const weekStarts = useMemo(
        () => buildWeekStarts(periodStart, periodEnd),
        [periodStart, periodEnd],
    );
    const totalWeeks = weekStarts.length;

    const [weekIndex, setWeekIndex] = useState(0);

    // Pre-bucket lessons/holidays by week once (fast paging)
    const { lessonsByWeek, holidaysByWeek } = useMemo(() => {
        const lessonsByWeek = Array.from({ length: totalWeeks }, () => [] as Data["lessons"]);
        const holidaysByWeek = Array.from({ length: totalWeeks }, () => [] as Data["holidays"]);

        const weekStartYmds = weekStarts.map((d) => ymdFromLocalDate(d));

        const weekIndexForDate = (ymd: string) => {
            // last weekStart <= ymd
            let idx = 0;
            for (let i = 0; i < weekStartYmds.length; i++) {
                if (weekStartYmds[i] <= ymd) idx = i;
            }
            return idx;
        };

        for (const l of data.lessons) {
            lessonsByWeek[weekIndexForDate(l.lessonDate)]!.push(l);
        }
        for (const h of data.holidays) {
            holidaysByWeek[weekIndexForDate(h.holidayDate)]!.push(h);
        }

        return { lessonsByWeek, holidaysByWeek };
    }, [data.lessons, data.holidays, totalWeeks, weekStarts]);

    const weekStart = weekStarts[weekIndex]!;
    const days = useMemo(
        () => [0, 1, 2, 3, 4, 5].map((i) => ymdFromLocalDate(addDays(weekStart, i))),
        [weekStart],
    );

    const holidaySet = useMemo(
        () => new Set((holidaysByWeek[weekIndex] ?? []).map((h) => h.holidayDate)),
        [holidaysByWeek, weekIndex],
    );

    const lessonByCell = useMemo(() => {
        const m = new Map<string, Data["lessons"][number]>();
        for (const l of lessonsByWeek[weekIndex] ?? []) {
            m.set(`${l.lessonDate}|${l.timeSlot}`, l);
        }
        return m;
    }, [lessonsByWeek, weekIndex]);

    return (
        <main className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm text-muted-foreground">
                        Period: {data.period.startDate} → {data.period.endDate}
                    </div>
                    <div className="text-lg font-semibold">
                        {formatRange(weekStarts[weekIndex]!)}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        disabled={weekIndex === 0}
                        onClick={() => setWeekIndex((x) => Math.max(0, x - 1))}
                    >
                        Prev
                    </Button>
                    <Button
                        disabled={weekIndex === totalWeeks - 1}
                        onClick={() => setWeekIndex((x) => Math.min(totalWeeks - 1, x + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
                <table className="w-full table-fixed border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                                Period
                            </th>

                            {days.map((ymd) => (
                                <th
                                    key={ymd}
                                    className="text-left text-xs font-medium px-3 py-2 border-b"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{ymd}</span>
                                        {/* {holidaySet.has(ymd) && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                                                Holiday
                                            </span>
                                        )} */}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {PERIODS.map((p) => (
                            <tr key={p}>
                                <td className="px-3 py-2 text-sm font-medium border-b">{p}</td>

                                {days.map((ymd) => {
                                    const hol = holidaySet.has(ymd);
                                    const lesson = lessonByCell.get(`${ymd}|${p}`);

                                    return (
                                        <td key={`${ymd}-${p}`} className="px-3 py-2 border-b align-top">
                                            <div
                                                className={[
                                                    "rounded-md p-2 h-16",                 // fixed height to prevent shifting
                                                    "flex flex-col justify-between",
                                                    "overflow-hidden",
                                                    hol
                                                        ? "bg-muted/40"
                                                        : lesson
                                                            ? (courseColorMap.get(lesson.courseName) ?? "bg-background")
                                                            : "bg-background",
                                                ].join(" ")}
                                            >
                                                {hol ? (
                                                    <div className="text-xs text-muted-foreground">—</div>
                                                ) : lesson ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-sm font-semibold truncate">{lesson.courseName}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            Lesson {lesson.lessonNumber}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground">—</div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
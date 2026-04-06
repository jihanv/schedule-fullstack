// app/dashboard/timeperiod/saved/[periodId]/SavedWeekPager.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BADGE_COLORS } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { toggleDeletedLessonForPeriod } from "@/app/actions/timeperiod";
import SavedManualCellPopover from "./saved-manual-cell-popover";

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
    deletedLessons: {
        dateKey: string;
        period: number;
    }[];
    manualLessons: {
        dateKey: string;
        period: number;
    }[];
};

export default function SavedWeekPager({ data }: { data: Data }) {
    const router = useRouter();
    const [pendingCellKey, setPendingCellKey] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [openManualCellKey, setOpenManualCellKey] = useState<string | null>(null);

    const courseColorMap = useMemo(() => {
        const names = data.courses.map((c) => c.courseName);
        return makeCourseColorMap(names, BADGE_COLORS);
    }, [data.courses]);

    const sectionNames = useMemo(
        () => data.courses.map((c) => c.courseName),
        [data.courses],
    );
    const cellBoxClass =
        "h-24 w-full rounded-md p-2 flex flex-col justify-between items-start text-left overflow-hidden";

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
    const deletedSet = useMemo(
        () => new Set(data.deletedLessons.map((item) => `${item.dateKey}|${item.period}`)),
        [data.deletedLessons],
    );

    const manualSet = useMemo(
        () => new Set(data.manualLessons.map((item) => `${item.dateKey}|${item.period}`)),
        [data.manualLessons],
    );
    const lessonByCell = useMemo(() => {
        const m = new Map<string, Data["lessons"][number]>();
        for (const l of lessonsByWeek[weekIndex] ?? []) {
            m.set(`${l.lessonDate}|${l.timeSlot}`, l);
        }
        return m;
    }, [lessonsByWeek, weekIndex]);

    async function handleToggleDeletedLesson(dateKey: string, period: number) {
        const cellKey = `${dateKey}|${period}`;

        setActionError(null);
        setPendingCellKey(cellKey);

        try {
            const result = await toggleDeletedLessonForPeriod({
                periodId: data.period.periodId,
                dateKey,
                period,
            });

            if (!result.ok) {
                setActionError(result.error);
                return;
            }

            router.refresh();
        } catch (error) {
            console.error("Failed to update saved lesson:", error);
            setActionError("Could not update this lesson.");
        } finally {
            setPendingCellKey(null);
        }
    }

    return (
        <main className="p-6 space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/timeperiod/saved/${data.period.periodId}`}>
                            Back to saved schedule
                        </Link>
                    </Button>

                    <Button asChild variant="outline">
                        <Link href="/dashboard/timeperiod/saved">
                            All saved schedules
                        </Link>
                    </Button>
                </div>

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
            </div>

            {actionError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {actionError}
                </div>
            ) : null}

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
                                    const cellKey = `${ymd}|${p}`;
                                    const hol = holidaySet.has(ymd);
                                    const lesson = lessonByCell.get(cellKey);
                                    const isDeletedCell = deletedSet.has(cellKey);
                                    const isManualCell = manualSet.has(cellKey);
                                    const isPending = pendingCellKey === cellKey;

                                    return (
                                        <td key={`${ymd}-${p}`} className="px-3 py-2 border-b align-top">
                                            {hol ? (
                                                <div className={`${cellBoxClass} bg-muted/40`}>
                                                    <div className="text-sm font-medium">{p}</div>
                                                    <div className="text-xs text-muted-foreground">—</div>
                                                    <div className="text-xs text-muted-foreground">Holiday</div>
                                                </div>
                                            ) : isDeletedCell ? (
                                                <div className={`${cellBoxClass} bg-muted/30 border border-dashed`}>
                                                    <div className="text-sm font-medium">{p}</div>
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        Deleted lesson
                                                    </div>
                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        disabled={isPending}
                                                        onClick={() => handleToggleDeletedLesson(ymd, p)}
                                                    >
                                                        {isPending ? "Saving..." : "Restore"}
                                                    </Button>
                                                </div>
                                            ) : isManualCell || !lesson ? (
                                                <SavedManualCellPopover
                                                    period={p}
                                                    sections={sectionNames}
                                                    assigned={isManualCell ? lesson?.courseName : undefined}
                                                    lessonNumber={isManualCell ? lesson?.lessonNumber : undefined}
                                                    subLabel={isManualCell ? "Manual lesson" : "Add manual lesson"}
                                                    subLabelClassName={isManualCell ? "font-bold text-red-700" : "text-muted-foreground"}
                                                    className={`${cellBoxClass} ${isManualCell && lesson
                                                        ? (courseColorMap.get(lesson.courseName) ?? "bg-background")
                                                        : "bg-muted/30"
                                                        }`}
                                                    open={openManualCellKey === cellKey}
                                                    onOpenChange={(open) => {
                                                        setOpenManualCellKey(open ? cellKey : null);
                                                    }}
                                                    onSelectSection={(section) => {
                                                        console.log("TODO: save manual lesson", {
                                                            dateKey: ymd,
                                                            period: p,
                                                            section,
                                                        });
                                                    }}
                                                    onClear={() => {
                                                        console.log("TODO: clear manual lesson", {
                                                            dateKey: ymd,
                                                            period: p,
                                                        });
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className={`${cellBoxClass} ${courseColorMap.get(lesson.courseName) ?? "bg-background"
                                                        }`}
                                                >
                                                    <div className="text-sm font-semibold truncate">{lesson.courseName}</div>

                                                    <div className="text-xs text-muted-foreground truncate">
                                                        Lesson {lesson.lessonNumber}
                                                    </div>

                                                    <Button
                                                        size="xs"
                                                        variant="outline"
                                                        disabled={isPending}
                                                        onClick={() => handleToggleDeletedLesson(ymd, p)}
                                                    >
                                                        {isPending ? "Saving..." : "Delete"}
                                                    </Button>
                                                </div>
                                            )}
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
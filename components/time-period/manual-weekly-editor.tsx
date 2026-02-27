"use client";

import React, { useMemo, useState } from "react";
import { PERIODS } from "@/lib/constants";
import { badgeColorFor } from "@/lib/utils";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useFormatter } from "next-intl";
import { Button } from "@/components/ui/button";
import ManualSectionPopover from "@/components/time-period/manual-section-popover";

/**
 * Utility: get Monday of the week for a given date
 */
function startOfWeekMonday(d: Date) {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay(); // 0=Sun .. 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // shift so Monday is start
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function addDays(base: Date, days: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

function formatHeader(d: Date) {
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    const mo = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ][d.getMonth()];
    return `${wd}, ${mo} ${d.getDate()}`;
}

/**
 * Build a list of Monday-start weeks between start and end
 */
function buildWeeks(start: Date, end: Date) {
    const weeks: { start: Date; days: Date[] }[] = [];
    let cur = startOfWeekMonday(start);
    while (cur <= end) {
        const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(cur, i)); // Mon..Sat
        // include only if week intersects range at all
        if (days.some((d) => d >= start && d <= end)) {
            weeks.push({ start: new Date(cur), days });
        }
        cur = addDays(cur, 7);
    }
    return weeks;
}

function dayKeyFromDate(d: Date): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" {
    // JS: 0=Sun, 1=Mon, ... 6=Sat
    const day = d.getDay();
    const KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    // If it's Sunday (0), we’ll never render it because our weeks are Mon–Sat,
    // but just in case, fall back to Monday.
    if (day === 0) return "Mon";
    return KEYS[day - 1];
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isHoliday(d: Date, list: Date[]) {
    return list?.some((h) => sameDay(h, d));
}

function dateKey(d: Date) {
    // Use local Y-M-D to avoid TZ drift; keeps keys stable
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ManualWeeklyEditor() {
    const {
        startDate,
        endDate,
        schedule,
        sections,
        holidays,
        deletedLessons,
        addDeletedLesson,
        removeDeletedLesson,

        manualLessons,
        // upsertManualLesson,
        // removeManualLesson,
    } = useTimePeriodStore();

    const format = useFormatter();

    // Build all weeks once
    const weeks = useMemo(
        () => (startDate && endDate ? buildWeeks(startDate, endDate) : []),
        [startDate, endDate],
    );

    // Pagination state: which week we are viewing
    const [page, setPage] = useState(0);

    // Track which cell's popover is open
    const [openCell, setOpenCell] = useState<{ dateKey: string; period: number } | null>(null);

    const meetingCount = React.useMemo(() => {
        // Map of "YYYY-MM-DD|<period>" -> meeting number for that section
        const map = new Map<string, number>();
        if (!startDate || !endDate) return map;

        // Running counter per section across the term
        const perSection = new Map<string, number>();

        // Quick lookup for manual lessons
        const manualMap = new Map<string, string>();
        for (const ml of manualLessons) {
            manualMap.set(`${ml.dateKey}|${ml.period}`, ml.section);
        }

        const slots: { date: Date; period: number; section: string }[] = [];

        for (const wk of weeks) {
            for (const d of wk.days) {
                // Skip outside the chosen range
                if (d < startDate || d > endDate) continue;
                // Skip holidays
                if (isHoliday(d, holidays)) continue;

                const dk = dateKey(d);
                const dayKey = dayKeyFromDate(d);

                for (const p of PERIODS) {
                    const k = `${dk}|${p}`;

                    // 1) Manual lesson wins for that slot (this is how we add classes to empty cells)
                    const manualSection = manualMap.get(k);
                    if (manualSection) {
                        slots.push({ date: d, period: p, section: manualSection });
                        continue;
                    }

                    // 2) Otherwise fall back to weekly-template schedule
                    const section = schedule[dayKey]?.[p];
                    if (!section) continue;

                    // Skip only applies to weekly-template lessons
                    const skipped = deletedLessons.some((x) => x.dateKey === dk && x.period === p);
                    if (skipped) continue;

                    slots.push({ date: d, period: p, section });
                }
            }
        }

        // Sort strictly by date, then by period
        slots.sort((a, b) => a.date.getTime() - b.date.getTime() || a.period - b.period);

        // Assign meeting numbers in chronological order, per section
        for (const s of slots) {
            const next = (perSection.get(s.section) ?? 0) + 1;
            perSection.set(s.section, next);
            map.set(`${dateKey(s.date)}|${s.period}`, next);
        }

        return map;
    }, [weeks, startDate, endDate, holidays, schedule, deletedLessons, manualLessons]);
    if (!startDate || !endDate) {
        return (
            <section className="w-full max-w-5xl mx-auto mt-4 space-y-6">
                <div className="rounded-2xl border bg-card p-4">
                    <div className="text-sm text-muted-foreground">
                        Set a start and end date first (Step 1).
                    </div>
                </div>
            </section>
        );
    }

    if (weeks.length === 0) {
        return (
            <section className="w-full max-w-5xl mx-auto mt-4 space-y-6">
                <div className="rounded-2xl border bg-card p-4">
                    <div className="text-sm text-muted-foreground">
                        No weeks found for that range.
                    </div>
                </div>
            </section>
        );
    }

    // Clamp page just in case
    const safePage = Math.min(Math.max(page, 0), weeks.length - 1);
    const week = weeks[safePage];

    const canPrev = safePage > 0;
    const canNext = safePage < weeks.length - 1;

    return (
        <section className="w-full max-w-5xl mx-auto mt-4 space-y-4">
            <div className="rounded-2xl border bg-card p-4">
                {/* Pagination header */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="secondary"
                        disabled={!canPrev}
                        onClick={() => {
                            setOpenCell(null);
                            setPage((p) => Math.max(0, p - 1));
                        }}
                    >
                        Prev week
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Week starting{" "}
                        <span className="font-medium text-foreground">
                            {format.dateTime(week.start, { dateStyle: "medium" })}
                        </span>{" "}
                        ({safePage + 1} / {weeks.length})
                    </div>

                    <Button
                        variant="secondary"
                        disabled={!canNext}
                        onClick={() => {
                            setOpenCell(null);
                            setPage((p) => Math.min(weeks.length - 1, p + 1));
                        }}
                    >
                        Next week
                    </Button>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full table-fixed border-separate border-spacing-0">
                        <thead>
                            <tr>
                                {/* <th className="sticky left-0 z-10 bg-card text-left text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                                    Period
                                </th> */}
                                {week.days.map((d, i) => {
                                    const hol = isHoliday(d, holidays);
                                    return (
                                        <th
                                            key={i}
                                            className={`text-left text-xs font-medium px-3 py-2 border-b ${hol ? "bg-muted/70" : "bg-card"
                                                }`}
                                        >
                                            <div className="font-semibold tracking-tight">
                                                {formatHeader(d)}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {PERIODS.map((p) => (
                                <tr key={p}>
                                    {/* <td className="sticky left-0 z-10 bg-card align-top px-3 py-2 text-sm font-medium border-b">
                                        {p}
                                    </td> */}

                                    {week.days.map((d, i) => {
                                        const hol = isHoliday(d, holidays);
                                        const outOfRange = d < startDate || d > endDate;

                                        const key = dayKeyFromDate(d);
                                        const assigned = schedule[key]?.[p];
                                        const cellDateKey = dateKey(d);

                                        const manual = manualLessons.find(
                                            (x) => x.dateKey === cellDateKey && x.period === p,
                                        );

                                        const displaySection = manual?.section ?? assigned;

                                        // Skip only applies to weekly-template assigned lessons (not manual)
                                        const isSkipped =
                                            !hol &&
                                            !outOfRange &&
                                            !!assigned &&
                                            !manual &&
                                            deletedLessons.some(
                                                (x) => x.dateKey === cellDateKey && x.period === p,
                                            );

                                        const colorClasses =
                                            !hol && !outOfRange && displaySection && !isSkipped
                                                ? badgeColorFor(displaySection, sections)
                                                : "";

                                        const classNum = meetingCount.get(`${cellDateKey}|${p}`);

                                        // Popover is for: empty cells OR manual cells
                                        const shouldUsePopover = !hol && !outOfRange && (!assigned || !!manual);

                                        const isThisOpen =
                                            openCell?.dateKey === cellDateKey && openCell?.period === p;

                                        return (
                                            <td key={i} className="align-top px-3 py-2 border-b">
                                                {hol ? (
                                                    <div className="rounded-md p-2 h-17 flex flex-col bg-muted/40 text-muted-foreground">
                                                        <div className="text-xs leading-tight">
                                                            <div className="font-medium"> {p}</div>
                                                            <div className="text-muted-foreground">Holiday</div>
                                                        </div>
                                                    </div>
                                                ) : outOfRange ? (
                                                    <div className="rounded-md p-2 h-17 flex flex-col bg-muted/40 text-muted-foreground">
                                                        <div className="text-xs leading-tight">
                                                            <div className="font-medium"> {p}</div>
                                                            <div className="text-muted-foreground">—</div>
                                                        </div>
                                                    </div>
                                                ) : shouldUsePopover ? (
                                                    <div className="h-17">
                                                        <ManualSectionPopover
                                                            dateKey={cellDateKey}
                                                            period={p}
                                                            assigned={manual?.section}
                                                            subLabel={manual ? `Meeting ${classNum ?? "—"}` : undefined}
                                                            open={isThisOpen}
                                                            onOpenChange={(open) => {
                                                                setOpenCell(open ? { dateKey: cellDateKey, period: p } : null);
                                                            }}
                                                        />
                                                        {/* {manual ? (
                                                            <div className="mt-1 text-[10px] text-muted-foreground">
                                                                Manual{classNum ? ` • Meeting ${classNum}` : ""}
                                                            </div>
                                                        ) : null} */}
                                                    </div>
                                                ) : (
                                                    // Normal assigned-class cell (weekly template)
                                                    <div
                                                        className={`rounded-md p-2 h-17 flex flex-col ${isSkipped
                                                            ? "bg-muted/60 text-muted-foreground"
                                                            : colorClasses || "bg-background"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <div className="font-medium leading-4"> {p}</div>

                                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                                {assigned ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isSkipped) {
                                                                                removeDeletedLesson(cellDateKey, p);
                                                                            } else {
                                                                                addDeletedLesson(cellDateKey, p);
                                                                            }
                                                                        }}
                                                                        className="text-xs leading-none font-bold opacity-70 hover:opacity-100"
                                                                        aria-label={isSkipped ? "Restore lesson" : "Delete lesson"}
                                                                        title={isSkipped ? "Restore lesson" : "Delete lesson"}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`text-xs leading-4 ${assigned ? "font-semibold" : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {assigned ?? "—"}
                                                        </div>

                                                        <div className="text-xs leading-4 min-h-4 text-muted-foreground">
                                                            {assigned ? (isSkipped ? "Skipped" : `Meeting ${classNum ?? "—"}`) : ""}
                                                        </div>
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

                {/* (Optional) quick hint for beginners */}
                <div className="mt-3 text-xs text-muted-foreground">
                    Tip: Click an <span className="font-medium">empty</span> cell to pick a section.
                    Manual edits appear with a “Manual” label.
                </div>
            </div>
        </section>
    );
}
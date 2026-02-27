"use client";

import React, { useMemo } from "react";
import { PERIODS } from "@/lib/constants";
import { badgeColorFor } from "@/lib/utils";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useFormatter, useTranslations } from "next-intl";

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
    const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
    return `${wd}, ${mo} ${d.getDate()}`;
}

/**
 * Build a list of Monday-start weeks between start and end
 */
function buildWeeks(start: Date, end: Date) {
    const weeks: { start: Date; days: Date[] }[] = [];
    let cur = startOfWeekMonday(start);
    while (cur <= end) {
        const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(cur, i));; // Mon..Sat
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
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
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
export default function WeeklyTables() {
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
    } = useTimePeriodStore();
    const showWeeklyPreview = useTimePeriodStore(s => s.showWeeklyPreview);
    const format = useFormatter();

    const t = useTranslations("WeeklyTables")
    // Always call hooks on every render
    const weeks = useMemo(
        () => (startDate && endDate ? buildWeeks(startDate, endDate) : []),
        [startDate, endDate]
    );

    const meetingCount = React.useMemo(() => {
        const map = new Map<string, number>();
        if (!startDate || !endDate) return map;

        const perSection = new Map<string, number>();

        // Quick lookup for manual lessons (manual wins for that slot)
        const manualMap = new Map<string, string>();
        for (const ml of manualLessons) {
            manualMap.set(`${ml.dateKey}|${ml.period}`, ml.section);
        }

        const slots: { date: Date; period: number; section: string }[] = [];

        for (const wk of weeks) {
            for (const d of wk.days) {
                if (d < startDate || d > endDate) continue;
                if (isHoliday(d, holidays)) continue;

                const dk = dateKey(d);
                const dayKey = dayKeyFromDate(d);

                for (const p of PERIODS) {
                    const k = `${dk}|${p}`;

                    // 1) Manual lesson for this slot (if any)
                    const manualSection = manualMap.get(k);
                    if (manualSection) {
                        slots.push({ date: d, period: p, section: manualSection });
                        continue;
                    }

                    // 2) Otherwise weekly template schedule
                    const section = schedule[dayKey]?.[p];
                    if (!section) continue;

                    const skipped = deletedLessons.some(
                        (x) => x.dateKey === dk && x.period === p
                    );
                    if (skipped) continue;

                    slots.push({ date: d, period: p, section });
                }
            }
        }

        slots.sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.period - b.period
        );

        for (const s of slots) {
            const next = (perSection.get(s.section) ?? 0) + 1;
            perSection.set(s.section, next);
            map.set(`${dateKey(s.date)}|${s.period}`, next);
        }

        return map;
    }, [weeks, startDate, endDate, holidays, schedule, deletedLessons, manualLessons]);


    // You can still early-return after hooks
    if (!showWeeklyPreview) return null;

    if (!startDate || !endDate) return null;

    return (
        <>
            <section className="w-full max-w-5xl mx-auto mt-4 space-y-6">
                <h2 className="text-xl font-semibold">{t("title")}</h2>

                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 text-sm text-muted-foreground">
                            {t("weekSubtitle", { date: format.dateTime(week.start, { dateStyle: "medium" }) })}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-card text-left text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                                            {t("periodHeader")}
                                        </th>
                                        {week.days.map((d, i) => {
                                            const hol = isHoliday(d, holidays);
                                            return (
                                                <th
                                                    key={i}
                                                    className={`text-left text-xs font-medium px-3 py-2 border-b ${hol ? "bg-muted/70" : "bg-card"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold tracking-tight">{formatHeader(d)}</div>
                                                        {hol && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                                                                {t("holiday")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {PERIODS.map((p) => (
                                        <tr key={p}>
                                            <td className="sticky left-0 z-10 bg-card align-top px-3 py-2 text-sm font-medium border-b">
                                                {p}
                                            </td>

                                            {week.days.map((d, i) => {
                                                const hol = isHoliday(d, holidays);
                                                const outOfRange = d < startDate! || d > endDate!;
                                                const key = dayKeyFromDate(d);              // "Mon" | ... | "Sat"
                                                const assigned = schedule[key]?.[p];         // e.g., "AB"
                                                const cellDateKey = dateKey(d);
                                                const manual = manualLessons.find(
                                                    (x) => x.dateKey === cellDateKey && x.period === p
                                                );

                                                const displaySection = manual?.section ?? assigned;
                                                const isSkipped =
                                                    !hol &&
                                                    !outOfRange &&
                                                    !!assigned &&
                                                    !manual && // don't treat manual lessons as skippable via deletedLessons
                                                    deletedLessons.some((x) => x.dateKey === cellDateKey && x.period === p);
                                                // Only color when NOT a holiday and within range
                                                const colorClasses =
                                                    !hol && !outOfRange && displaySection && !isSkipped
                                                        ? badgeColorFor(displaySection, sections)
                                                        : "";

                                                // Pull precomputed class count (if any)
                                                const classNum = meetingCount.get(`${cellDateKey}|${p}`);

                                                const content = hol ? (
                                                    <div className="text-xs leading-tight">
                                                        <div className="font-medium">{t("periodLabelShort", { period: p })}</div>
                                                        <div className="text-muted-foreground">{t("holiday")}</div>
                                                        <div className="text-muted-foreground">{t("holidayClassPlaceholder")}</div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start justify-between gap-1">
                                                            <div className="font-medium leading-4">
                                                                {t("periodLabelShort", { period: p })}
                                                            </div>

                                                            {/* reserve a fixed slot so layout stays stable */}
                                                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                                {assigned && !outOfRange && !manual ? (
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

                                                        <div className={`text-xs leading-4 ${assigned ? "font-semibold" : "text-muted-foreground"}`}>
                                                            {displaySection ?? "—"}
                                                        </div>

                                                        <div className={`text-xs leading-4 min-h-4 ${assigned ? "opacity-100" : "text-muted-foreground"}`}>
                                                            {displaySection
                                                                ? manual
                                                                    ? `${t("meetingLabel", { count: classNum ?? "—" })}`
                                                                    : isSkipped
                                                                        ? "Skipped"
                                                                        : t("meetingLabel", { count: classNum ?? "—" })
                                                                : ""}
                                                        </div>
                                                    </>
                                                );

                                                return (
                                                    <td key={i} className="align-top px-3 py-2 border-b">
                                                        <div
                                                            className={`rounded-md p-2 h-17 flex flex-col ${hol || outOfRange
                                                                ? "bg-muted/40 text-muted-foreground"
                                                                : isSkipped
                                                                    ? "bg-muted/60 text-muted-foreground"
                                                                    : colorClasses || "bg-background"
                                                                }`}
                                                        >
                                                            {content}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </section>
        </>
    );
}


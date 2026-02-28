"use client";

import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import {
    ALIGN_CENTER_MULTI,
    ALIGN_CENTER_ONE,
    EXCEL_BADGE_PALETTE,
    HOLIDAY_FILL,
    HOLIDAY_FONT,
    PERIODS,
    ROW_HEIGHT_4_LINES,
    Slot,
} from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations, useFormatter } from "next-intl";

// ----- helpers -----
function startOfWeekMonday(d: Date) {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay(); // 0=Sun..6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
function addDays(base: Date, days: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

// Map Date -> your weekday keys ("Mon" | ... | "Sat")
function dayKeyFromDate(
    d: Date,
): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" {
    const day = d.getDay();
    const KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    if (day === 0) return "Mon"; // we never export Sunday; safe fallback
    return KEYS[day - 1];
}

function excelColorsForSection(section: string, sections: string[]) {
    const i = sections.indexOf(section);
    if (i < 0) return null;
    const slot = EXCEL_BADGE_PALETTE[i % EXCEL_BADGE_PALETTE.length];
    return slot;
}

function* weekStartsBetween(start: Date, end: Date) {
    // If the selected period starts on Sunday, skip it.
    // Our schedule/export only uses Mon–Sat, so starting on Sunday would create an empty “previous week” block.
    const effectiveStart = start.getDay() === 0 ? addDays(start, 1) : start;
    let cur = startOfWeekMonday(effectiveStart);
    while (cur <= end) {
        yield new Date(cur);
        cur = addDays(cur, 7);
    }
}

// Same-day + holiday detectors
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
    // local YYYY-MM-DD (stable, avoids TZ drift)
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ExportExcelButton() {
    const {
        startDate,
        endDate,
        schedule,
        sections,
        pendingHolidays,
        commitPendingHolidays,
        deletedLessons,
        manualLessons,
    } = useTimePeriodStore();

    const t = useTranslations("ExportExcel")
    const format = useFormatter();

    const handleExport = async () => {


        commitPendingHolidays();

        if (!startDate || !endDate) {
            alert(t("alerts.missingDates"));
            return;
        }

        const deletedSet = new Set(
            deletedLessons.map((x) => `${x.dateKey}|${x.period}`)
        );

        // Manual lessons lookup: `${YYYY-MM-DD}|${period}` -> section
        const manualMap = new Map<string, string>();
        for (const ml of manualLessons) {
            manualMap.set(`${ml.dateKey}|${ml.period}`, ml.section);
        }

        // Build chronological list of actual meetings (in range, non-holiday, assigned)
        const slots: Slot[] = [];

        for (const weekStart of weekStartsBetween(startDate, endDate)) {
            const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(weekStart, i)); // Mon..Sat
            for (const d of days) {
                if (d < startDate || d > endDate) continue; // out-of-range day
                if (isHoliday(d, pendingHolidays)) continue; // holiday day
                const key = dayKeyFromDate(d); // "Mon".."Sat"
                const dk = dateKey(d);

                for (const p of PERIODS) {
                    const slotKey = `${dk}|${p}`;

                    // 1) Manual lesson wins for this slot
                    const manualSection = manualMap.get(slotKey);
                    if (manualSection) {
                        slots.push({ date: d, period: p, section: manualSection });
                        continue;
                    }

                    // 2) Otherwise weekly schedule
                    const section = schedule[key]?.[p];
                    if (!section) continue;

                    // deletedLessons only applies to weekly schedule lessons
                    if (deletedSet.has(slotKey)) continue;

                    slots.push({ date: d, period: p, section });
                }
            }
        }

        // Sort by date, then by period (strict chronological order)
        slots.sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.period - b.period,
        );

        // Walk once to assign running "Class n" per section
        const meetingCount = new Map<string, number>(); // key: `${YYYY-MM-DD}|${period}` → n
        const perSection = new Map<string, number>(); // section → running n

        for (const s of slots) {
            const n = (perSection.get(s.section) ?? 0) + 1;
            perSection.set(s.section, n);
            meetingCount.set(`${dateKey(s.date)}|${s.period}`, n);
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(t("workbook.sheetName"));

        // Column widths (A..G) — set once, used for every week block
        ws.columns = [
            { key: "period", width: 10 },
            { key: "d1", width: 22 },
            { key: "d2", width: 22 },
            { key: "d3", width: 22 },
            { key: "d4", width: 22 },
            { key: "d5", width: 22 },
            { key: "d6", width: 22 },
        ];

        let row = 1; // running row pointer

        for (const weekStart of weekStartsBetween(startDate, endDate)) {
            // --- Title row ---
            ws.getCell(row, 1).value = t("headers.weekTitle", {
                date: format.dateTime(weekStart, { year: "numeric", month: "short", day: "numeric" }),
            });
            ws.getRow(row).font = { bold: true };
            ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;
            row += 2; // leave a blank row for spacing (title on row, blank row next)

            // --- Header row: Mon–Sat with dates ---
            const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(weekStart, i)); // Mon..Sat
            ws.getRow(row).values = [
                t("headers.period"),
                ...days.map((d) =>
                    format.dateTime(d, { weekday: "short", month: "short", day: "numeric" })
                ),
            ];
            ws.getRow(row).font = { bold: true };
            ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;

            for (let i = 0; i < days.length; i++) {
                const d = days[i];
                if (isHoliday(d, pendingHolidays)) {
                    const cell = ws.getRow(row).getCell(i + 2); // B..G
                    // Add a 2nd line that says "Holiday"
                    cell.value = format.dateTime(d, { weekday: "short", month: "short", day: "numeric" });
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: "left",
                        wrapText: true,
                    };
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: HOLIDAY_FILL },
                    };
                    cell.font = { bold: true, color: { argb: HOLIDAY_FONT } };
                }
            }

            // Remember header row to add borders later
            const headerRowIndex = row;
            row += 1;

            // --- Body rows: one row per period ---
            // const periodStartRow = row;
            for (const p of PERIODS) {
                const r = ws.getRow(row++);
                r.height = ROW_HEIGHT_4_LINES;

                // Period label (col A)
                const periodCell = r.getCell(1);
                periodCell.value = p;
                periodCell.alignment = ALIGN_CENTER_MULTI;

                // Day cells (B..G)
                days.forEach((d, i) => {
                    const cell = r.getCell(i + 2);

                    // Outside selected range → blank
                    if (d < startDate || d > endDate) {
                        cell.value = "";
                        cell.alignment = ALIGN_CENTER_MULTI;
                        return;
                    }

                    // Holiday (you chose one-line earlier like `${p} — Holiday`)
                    if (isHoliday(d, pendingHolidays)) {
                        cell.value = t("cells.holidayLine", {
                            periodLabel: t("cells.periodLine", { period: p }),
                            holiday: t("labels.holiday"),
                        });
                        cell.alignment = ALIGN_CENTER_ONE; // or ALIGN_CENTER_MULTI if multi-line
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: HOLIDAY_FILL },
                        };
                        cell.font = { color: { argb: HOLIDAY_FONT } };
                        return;
                    }

                    // Normal day with assignment (manual wins)
                    const key = dayKeyFromDate(d);
                    const slotKey = `${dateKey(d)}|${p}`;

                    const manualSection = manualMap.get(slotKey);
                    const isManual = !!manualSection;

                    const section = manualSection ?? schedule[key]?.[p] ?? "";

                    // deletedLessons only applies to weekly schedule lessons
                    const isDeleted = !isManual && deletedSet.has(slotKey);

                    if (!section || isDeleted) {
                        cell.value = "";
                        cell.alignment = ALIGN_CENTER_MULTI;
                        return;
                    }

                    const n = meetingCount.get(slotKey);
                    cell.value = `${t("cells.periodLine", { period: p })}\n${section}\n${t("cells.meetingLine", {
                        count: n ?? "—",
                    })}`;

                    cell.alignment = ALIGN_CENTER_MULTI;
                    // keep your existing color code right after this (fill/font from palette)

                    const colors = excelColorsForSection(section, sections);
                    if (colors) {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: colors.fill },
                        };
                        cell.font = { color: { argb: colors.font }, bold: true };
                    }
                });

                r.commit();
            }
            const periodEndRow = row - 1;

            // --- Borders for this week's block (header + body) ---
            for (let r = headerRowIndex; r <= periodEndRow; r++) {
                for (let c = 1; c <= 7; c++) {
                    ws.getCell(r, c).border = {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" },
                    };
                }
            }

            // --- Spacer row between weeks ---
            row += 1;
        }

        // Download
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = t("download.filename");
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            className="w-55"
            onClick={() => {
                handleExport();
            }}
            variant="default"
        >
            {t("button")}
        </Button>
    );
}



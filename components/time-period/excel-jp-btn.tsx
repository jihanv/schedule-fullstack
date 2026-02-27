// app/components/export/ExportExcelButtonJa.tsx
"use client";

import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import {
    EXCEL_BADGE_PALETTE,
    HOLIDAY_FILL,
    HOLIDAY_FONT,
    PERIODS,
    ROW_HEIGHT_4_LINES,
} from "@/lib/constants";
import { ALIGN_CENTER_MULTI, ALIGN_CENTER_ONE, Slot } from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";

// ----- helpers (same logic, JP labels) -----
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
function headerLabelJa(d: Date) {
    // e.g., "10月13日（木）"
    const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日（${youbi}）`;
}
// Map Date -> your weekday keys ("Mon" | ... | "Sat")
function dayKeyFromDate(
    d: Date,
): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" {
    const day = d.getDay();
    const KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
    if (day === 0) return "Mon"; // Sunday not used; safe fallback
    return KEYS[day - 1];
}
function excelColorsForSection(section: string, sections: string[]) {
    const i = sections.indexOf(section);
    if (i < 0) return null;
    return EXCEL_BADGE_PALETTE[i % EXCEL_BADGE_PALETTE.length];
}
function* weekStartsBetween(start: Date, end: Date) {
    let cur = startOfWeekMonday(start);
    while (cur <= end) {
        yield new Date(cur);
        cur = addDays(cur, 7);
    }
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
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ExportExcelButtonJa() {
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

    const handleExport = async () => {
        commitPendingHolidays();
        if (!startDate || !endDate) {
            alert("先に開始日と終了日を選択してください。");
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
                if (d < startDate || d > endDate) continue;
                if (isHoliday(d, pendingHolidays)) continue;
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

        // Sort strict chronological
        slots.sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.period - b.period,
        );

        // Running "第n回" per section
        const meetingCount = new Map<string, number>(); // `${YYYY-MM-DD}|${period}` → n
        const perSection = new Map<string, number>(); // section → running n
        for (const s of slots) {
            const n = (perSection.get(s.section) ?? 0) + 1;
            perSection.set(s.section, n);
            meetingCount.set(`${dateKey(s.date)}|${s.period}`, n);
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("時間割");

        // Column widths (A..G)
        ws.columns = [
            { header: "時限", key: "period", width: 10 },
            { header: "月", key: "d1", width: 22 },
            { header: "火", key: "d2", width: 22 },
            { header: "水", key: "d3", width: 22 },
            { header: "木", key: "d4", width: 22 },
            { header: "金", key: "d5", width: 22 },
            { header: "土", key: "d6", width: 22 },
        ];

        let row = 1;

        for (const weekStart of weekStartsBetween(startDate, endDate)) {
            // --- Title row ---
            ws.getCell(row, 1).value =
                `週間時間割（${headerLabelJa(weekStart)}の週）`;
            ws.getRow(row).font = { bold: true };
            ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;
            row += 2;

            // --- Header row: Mon–Sat with JP dates ---
            const days = [0, 1, 2, 3, 4, 5].map((i) => addDays(weekStart, i));
            ws.getRow(row).values = ["時限", ...days.map((d) => headerLabelJa(d))];
            ws.getRow(row).font = { bold: true };
            ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;

            // Mark holidays in header
            for (let i = 0; i < days.length; i++) {
                const d = days[i];
                if (isHoliday(d, pendingHolidays)) {
                    const cell = ws.getRow(row).getCell(i + 2);
                    cell.value = `${headerLabelJa(d)} 祝日`;
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

            const headerRowIndex = row;
            row += 1;

            // --- Body rows ---
            for (const p of PERIODS) {
                const r = ws.getRow(row++);
                r.height = ROW_HEIGHT_4_LINES;

                // A: 時限
                const periodCell = r.getCell(1);
                periodCell.value = `${p}限`;
                periodCell.alignment = ALIGN_CENTER_MULTI;

                // B..G
                days.forEach((d, i) => {
                    const cell = r.getCell(i + 2);

                    if (d < startDate || d > endDate) {
                        cell.value = "";
                        cell.alignment = ALIGN_CENTER_MULTI;
                        return;
                    }

                    if (isHoliday(d, pendingHolidays)) {
                        cell.value = `${p}限 — 祝日`;
                        cell.alignment = ALIGN_CENTER_ONE;
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
                    cell.value = `Period ${p}\n${section}\n${isManual ? "Manual " : ""}Meeting ${n ?? "—"}`;

                    cell.alignment = ALIGN_CENTER_MULTI;

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

            // Borders for this week block
            const lastBodyRow = row - 1;
            for (let r = headerRowIndex; r <= lastBodyRow; r++) {
                for (let c = 1; c <= 7; c++) {
                    ws.getCell(r, c).border = {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" },
                    };
                }
            }

            // spacer
            row += 1;
        }

        // Download (JP filename)
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "時間割.xlsx";
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
            {/* Japanese label */}
            Excelを出力（全週）
        </Button>
    );
}

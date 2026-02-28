"use client";

import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

type WeeklySchedule = Record<DayName, Record<string, string | null | undefined>>;

type ManualLesson = { dateKey: string; period: number; section: string };
type DeletedLesson = { dateKey: string; period: number };

type Holiday = Date | string;

export default function ExportAttendanceButton() {

    const { sections, startDate, endDate, pendingHolidays, schedule, manualLessons, deletedLessons } =
        useTimePeriodStore();


    const handleExport = async () => {
        const start = startDate;
        const end = endDate;
        const typedManualLessons = manualLessons as unknown as ManualLesson[];
        const typedDeletedLessons = deletedLessons as unknown as DeletedLesson[];

        if (!start || !end) {
            alert("Please set a start and end date first.");
            return;
        }
        const wb = new ExcelJS.Workbook();
        const listWs = wb.addWorksheet("Lists");
        ["忌", "停", "公", "欠"].forEach((v, i) => {
            listWs.getCell(i + 1, 1).value = v; // A1..A5
        });
        listWs.state = "veryHidden";
        // test dates for now (we will replace with real lesson dates next step)
        // const dateHeaders = ["2026-02-28", "2026-03-03", "2026-03-07"];

        // if user hasn't added sections yet, still export 1 sheet
        const sectionNames = sections.length ? sections : ["Attendance"];

        // helper: Excel sheet names can't be longer than 31 and can't contain certain characters
        const sanitizeSheetName = (name: string) =>
            name.replace(/[\[\]\*\?\/\\:]/g, "").slice(0, 31) || "Sheet";

        const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

        const toDateKey = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        };

        const holidayKeys = new Set(
            (pendingHolidays as Holiday[]).map((h) => (h instanceof Date ? toDateKey(h) : String(h)))
        );

        type Slot = { dateKey: string; period: number };

        const getMeetingSlotsForSection = (sectionName: string): Slot[] => {
            const slots: Slot[] = [];

            // walk day-by-day
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayName = DAYS[d.getDay()];
                if (dayName === "Sun") continue;

                const dateKey = toDateKey(d);
                if (holidayKeys.has(dateKey)) continue;

                const weekday = dayName as DayName; // safe because we already "continue" on Sun
                const daySchedule = (schedule as unknown as WeeklySchedule)[weekday] ?? {};

                // collect periods from weekly schedule + manual lessons on that date
                const periodSet = new Set<number>();
                Object.keys(daySchedule).forEach((p) => periodSet.add(Number(p)));

                typedManualLessons.forEach((ml) => {
                    if (ml.dateKey === dateKey) periodSet.add(ml.period);
                });

                const periods = Array.from(periodSet).sort((a, b) => a - b);

                for (const period of periods) {
                    const manual = typedManualLessons.find(
                        (ml) => ml.dateKey === dateKey && ml.period === period
                    );

                    const weeklySection = daySchedule[String(period)];
                    const chosenSection = manual?.section ?? weeklySection;

                    if (!chosenSection) continue;

                    // if it's a weekly lesson, allow deletions to remove it (manual overrides still show)
                    const isDeleted =
                        !manual &&
                        typedDeletedLessons.some(
                            (dl) => dl.dateKey === dateKey && dl.period === period
                        );

                    if (isDeleted) continue;

                    if (chosenSection === sectionName) {
                        slots.push({ dateKey, period });
                    }
                }
            }

            return slots;
        };

        const buildSheet = (ws: ExcelJS.Worksheet, sectionName: string) => {
            const applyThinBorder = (cell: ExcelJS.Cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            };

            const applyCenter = (cell: ExcelJS.Cell) => {
                cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            };

            const NUM_STUDENTS = 42;
            const lastRow = 1 + NUM_STUDENTS;

            // --- headers ---
            ws.getCell("A1").value = "学番";
            ws.getCell("B1").value = "Student Name";
            ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
            const meetingSlots = getMeetingSlotsForSection(sectionName);
            const dateHeaders = meetingSlots.map(
                (s, idx) => `${s.dateKey}\nPeriod ${s.period}\nMeeting - ${idx + 1}`
            );

            const firstDateCol = 3; // column C
            dateHeaders.forEach((d, i) => {
                ws.getCell(1, firstDateCol + i).value = d;
            });
            ws.getRow(1).height = 45;
            const stopCol = firstDateCol + dateHeaders.length; // after last date
            const absentCol = stopCol + 1;

            ws.getCell(1, stopCol).value = "停";
            ws.getCell(1, absentCol).value = "欠";

            // widths
            ws.getColumn(1).width = 10;  // Student #
            ws.getColumn(2).width = 18;  // Student Name
            for (let i = 0; i < dateHeaders.length; i++) ws.getColumn(firstDateCol + i).width = 16;
            ws.getColumn(stopCol).width = 6;
            ws.getColumn(absentCol).width = 6;

            // --- rows ---
            for (let row = 2; row < 2 + NUM_STUDENTS; row++) {
                ws.getCell(row, 1).value = row - 1; // Student #
                ws.getCell(row, 2).value = "";      // Student Name blank

                for (let i = 0; i < dateHeaders.length; i++) {
                    const col = firstDateCol + i;
                    ws.getCell(row, col).dataValidation = {
                        type: "list",
                        allowBlank: true,
                        formulae: ["Lists!$A$1:$A$5"],
                    };
                }

                const first = ws.getColumn(firstDateCol).letter;
                const last = ws.getColumn(firstDateCol + dateHeaders.length - 1).letter;

                ws.getCell(row, stopCol).value = {
                    formula: `COUNTIF(${first}${row}:${last}${row},"停")`,
                };
                ws.getCell(row, absentCol).value = {
                    formula: `COUNTIF(${first}${row}:${last}${row},"欠")`,
                };
            }

            // --- conditional formatting (same as before) ---
            const lastDateCol = 2 + dateHeaders.length;
            ws.addConditionalFormatting({
                ref: `B2:${ws.getColumn(lastDateCol).letter}${lastRow}`,
                rules: [
                    { type: "containsText", operator: "containsText", text: "忌", priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFC7CE" } } } },
                    { type: "containsText", operator: "containsText", text: "停", priority: 2, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFE699" } } } },
                    { type: "containsText", operator: "containsText", text: "公", priority: 3, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFBDD7EE" } } } },
                    { type: "containsText", operator: "containsText", text: "欠", priority: 4, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD9EAD3" } } } },
                ],
            });

            // --- borders + center for entire table ---
            for (let r = 1; r <= lastRow; r++) {
                for (let c = 1; c <= absentCol; c++) {
                    const cell = ws.getCell(r, c);
                    applyThinBorder(cell);
                    applyCenter(cell);
                }
            }
        };

        // build one sheet per section
        const used = new Set<string>();
        for (const sec of sectionNames) {
            const name = sanitizeSheetName(sec);
            let candidate = name;
            let n = 2;
            while (used.has(candidate)) {
                candidate = sanitizeSheetName(`${name}-${n}`);
                n++;
            }
            used.add(candidate);

            const ws = wb.addWorksheet(candidate);
            buildSheet(ws, sec);
        }

        // Download
        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Attendance.xlsx";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button onClick={handleExport} variant="default">
            Export Attendance
        </Button>
    );
}
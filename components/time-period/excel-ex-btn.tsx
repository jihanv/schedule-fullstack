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
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { IoDownloadOutline } from "react-icons/io5";
import {
  dayKeyFromDate,
  toDateKey,
  isHoliday,
  buildWeeks,
  buildManualLessonMap
} from "@/lib/utils";

// ----- helpers -----

function excelColorsForSection(section: string, sections: string[]) {
  const i = sections.indexOf(section);
  if (i < 0) return null;
  const slot = EXCEL_BADGE_PALETTE[i % EXCEL_BADGE_PALETTE.length];
  return slot;
}

// function* weekStartsBetween(start: Date, end: Date) {
//   // If the selected period starts on Sunday, skip it.
//   // Our schedule/export only uses Mon–Sat, so starting on Sunday would create an empty “previous week” block.
//   const effectiveStart = start.getDay() === 0 ? addDays(start, 1) : start;
//   let cur = startOfWeekMonday(effectiveStart);
//   while (cur <= end) {
//     yield new Date(cur);
//     cur = addDays(cur, 7);
//   }
// }
export default function ExportExcelButton() {
  const {
    startDate,
    endDate,
    schedule,
    sections,
    pendingHolidays,
    commitPendingHolidays,
    manualLessons,
    isDeletedLesson
  } = useTimePeriodStore();

  const t = useTranslations("ExportExcel");
  const b = useTranslations("Export");
  const locale = useLocale();
  const dateFnsLocale = locale === "ja" ? ja : enUS;

  const weekdayHeaders = [
    t("headers.mon"),
    t("headers.tue"),
    t("headers.wed"),
    t("headers.thu"),
    t("headers.fri"),
    t("headers.sat"),
  ] as const;

  const formatWeekTitleDate = (date: Date) =>
    format(date, locale === "ja" ? "yyyy/M/d" : "MMM d, yyyy", {
      locale: dateFnsLocale,
    });

  const formatHeaderDate = (date: Date, columnIndex: number) =>
    `${weekdayHeaders[columnIndex]} ${format(
      date,
      locale === "ja" ? "M/d" : "MMM d",
      { locale: dateFnsLocale },
    )}`;

  const handleExport = async () => {
    commitPendingHolidays();

    if (!startDate || !endDate) {
      alert(t("alerts.missingDates"));
      return;
    }
    const weeks = buildWeeks(startDate, endDate);

    // Manual lessons lookup: `${YYYY-MM-DD}|${period}` -> section
    const manualMap = buildManualLessonMap(manualLessons);

    // Build chronological list of actual meetings (in range, non-holiday, assigned)
    const slots: Slot[] = [];

    for (const week of weeks) {
      for (const d of week.days) {
        if (d < startDate || d > endDate) continue; // out-of-range day
        if (isHoliday(d, pendingHolidays)) continue; // holiday day
        const key = dayKeyFromDate(d); // "Mon".."Sat"
        const dk = toDateKey(d);

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
          if (isDeletedLesson(dk, p)) continue;

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
      meetingCount.set(`${toDateKey(s.date)}|${s.period}`, n);
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

    for (const week of weeks) {
      const weekStart = week.start;
      // --- Title row ---
      ws.getCell(row, 1).value = t("headers.weekTitle", {
        date: formatWeekTitleDate(weekStart),
      });
      ws.getRow(row).font = { bold: true };
      ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;
      row += 2; // leave a blank row for spacing (title on row, blank row next)

      // --- Header row: Mon–Sat with dates ---
      const days = week.days;
      ws.getRow(row).values = [
        t("headers.period"),
        ...days.map((d, i) => formatHeaderDate(d, i)),
      ];
      ws.getRow(row).font = { bold: true };
      ws.getRow(row).height = ROW_HEIGHT_4_LINES / 2;

      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        if (isHoliday(d, pendingHolidays)) {
          const cell = ws.getRow(row).getCell(i + 2); // B..G
          // Add a 2nd line that says "Holiday"
          cell.value = formatHeaderDate(d, i);
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
          const slotKey = `${toDateKey(d)}|${p}`;

          const manualSection = manualMap.get(slotKey);
          const isManual = !!manualSection;

          const section = manualSection ?? schedule[key]?.[p] ?? "";

          // deletedLessons only applies to weekly schedule lessons
          const isDeleted = !isManual && isDeletedLesson(toDateKey(d), p);

          if (!section || isDeleted) {
            cell.value = "";
            cell.alignment = ALIGN_CENTER_MULTI;
            return;
          }

          const n = meetingCount.get(slotKey);
          cell.value = `${t("cells.periodLine", { period: p })}\n${section}\n${t(
            "cells.meetingLine",
            {
              count: n ?? "—",
            },
          )}`;

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
      className="w-65 text-white inline-flex items-center gap-2"
      onClick={handleExport}
      variant="default"
    >
      <IoDownloadOutline />
      {b("timetable")}
    </Button>
  );
}

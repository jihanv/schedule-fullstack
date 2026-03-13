"use client";

import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { IoDownloadOutline } from "react-icons/io5";
import { useTranslations } from "next-intl";
type DayName = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

type WeeklySchedule = Record<
  DayName,
  Record<string, string | null | undefined>
>;

type ManualLesson = { dateKey: string; period: number; section: string };
type DeletedLesson = { dateKey: string; period: number };

type Holiday = Date | string;

export default function ExportAttendanceButton() {
  const {
    sections,
    startDate,
    endDate,
    pendingHolidays,
    schedule,
    manualLessons,
    deletedLessons,
  } = useTimePeriodStore();

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

    // Column A: attendance options (5 items)
    const ATTENDANCE_ALLOWED = ["忌", "停", "公", "欠", "ホ", " "];
    ATTENDANCE_ALLOWED.forEach((v, i) => {
      listWs.getCell(i + 1, 1).value = v; // A1..A5
    });

    // Column B: lesson status options (2 items)
    const LESSON_STATUS = ["未実施", "実施済"];
    LESSON_STATUS.forEach((v, i) => {
      listWs.getCell(i + 1, 2).value = v; // B1..B2
    });

    listWs.state = "veryHidden";

    // Ranges we'll use later:
    const attendanceRange = `Lists!$A$1:$A$6`;
    const statusRange = `Lists!$B$1:$B$2`;

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
      (pendingHolidays as Holiday[]).map((h) =>
        h instanceof Date ? toDateKey(h) : String(h),
      ),
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
        const daySchedule =
          (schedule as unknown as WeeklySchedule)[weekday] ?? {};

        // collect periods from weekly schedule + manual lessons on that date
        const periodSet = new Set<number>();
        Object.keys(daySchedule).forEach((p) => periodSet.add(Number(p)));

        typedManualLessons.forEach((ml) => {
          if (ml.dateKey === dateKey) periodSet.add(ml.period);
        });

        const periods = Array.from(periodSet).sort((a, b) => a - b);

        for (const period of periods) {
          const manual = typedManualLessons.find(
            (ml) => ml.dateKey === dateKey && ml.period === period,
          );

          const weeklySection = daySchedule[String(period)];
          const chosenSection = manual?.section ?? weeklySection;

          if (!chosenSection) continue;

          // if it's a weekly lesson, allow deletions to remove it (manual overrides still show)
          const isDeleted =
            !manual &&
            typedDeletedLessons.some(
              (dl) => dl.dateKey === dateKey && dl.period === period,
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
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      };

      const NUM_STUDENTS = 42;

      const STATUS_ROW = 1; // NEW row for finished/not finished (we'll use it next step)
      const YEAR_ROW = 2; // was row 1
      const DATE_ROW = 3; // was row 2
      const PERIOD_ROW = 4; // was row 3

      const HEADER_ROWS = 5; // header area is now rows 1-5
      const HEADER_ROW = 5; // “番号/名前” + “第n回” row is now row 5
      const FIRST_STUDENT_ROW = 6; // students start at row 6 now

      const lastRow = HEADER_ROWS + NUM_STUDENTS; // 4 + 42 = 46

      // --- headers ---
      const meetingSlots = getMeetingSlotsForSection(sectionName);
      const hasNoPeriods = meetingSlots.length === 0;

      const dateHeaders = meetingSlots.map((s) => s.dateKey);

      if (hasNoPeriods) {
        ws.mergeCells("A1:D3");
        ws.getCell("A1").value = "このクラスには選択された時限がありません";
        ws.getCell("A1").alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        ws.getColumn(1).width = 15;
        ws.getColumn(2).width = 15;
        ws.getColumn(3).width = 15;
        ws.getColumn(4).width = 15;
        return;
      }
      ws.getCell(HEADER_ROW, 1).value = "番号";
      ws.getCell(HEADER_ROW, 2).value = "名前";
      ws.views = [{ state: "frozen", xSplit: 2, ySplit: HEADER_ROWS }];
      const firstDateCol = 3; // column C

      meetingSlots.forEach((slot, i) => {
        const col = firstDateCol + i;
        // Row 1: lesson status dropdown (default: not finished)
        const statusCell = ws.getCell(STATUS_ROW, col);
        statusCell.value = "未実施";
        statusCell.dataValidation = {
          type: "list",
          allowBlank: false,
          formulae: [statusRange],
          showErrorMessage: true,
          errorStyle: "error",
          errorTitle: "Invalid input",
          error: "Choose only: not finished / finished",
        };
        const [yyyy, mm, dd] = slot.dateKey.split("-");

        // Row 1: Year
        ws.getCell(YEAR_ROW, col).value = Number(yyyy);
        ws.getCell(DATE_ROW, col).value = `${mm}-${dd}`;
        ws.getCell(PERIOD_ROW, col).value = `${slot.period} 時限`;
        const cell = ws.getCell(HEADER_ROW, col);

        cell.value = {
          formula: `COLUMN()-${firstDateCol - 1}`,
        };

        cell.numFmt = '"第"0"回"';

        // --- NEW: gray out " " cells when status is finished ---
        const colLetter = ws.getColumn(col).letter;

        // Apply to the student rows in THIS column (e.g., C6:C46)
        ws.addConditionalFormatting({
          ref: `${colLetter}${FIRST_STUDENT_ROW}:${colLetter}${lastRow}`,
          rules: [
            {
              type: "expression",
              // Example (for column C): AND($C$1="finished", C6=" ")
              formulae: [
                `AND($${colLetter}$${STATUS_ROW}="実施済",${colLetter}${FIRST_STUDENT_ROW}=" ")`,
              ],
              priority: 50,
              style: {
                fill: {
                  type: "pattern",
                  pattern: "solid",
                  bgColor: { argb: "FFD9D9D9" }, // light gray
                },
              },
            },
          ],
        });
      });

      const stopCol = firstDateCol + dateHeaders.length; // after last date
      const mourningCol = stopCol + 1;
      const absentOnlyCol = mourningCol + 1;
      const homeCol = absentOnlyCol + 1;
      const beforeMainSpacerCol = homeCol + 1;
      const stopMourningCol = beforeMainSpacerCol + 1;
      const absentCol = stopMourningCol + 1;

      // blank spacer column + total class hours column
      const spacerCol = absentCol + 1;
      const totalHoursCol = spacerCol + 1;

      const afterTotalSpacerCol = totalHoursCol + 1; // blank column after 総授業時数
      const baseHoursCol = afterTotalSpacerCol + 1; // where user types the number

      ws.getCell(HEADER_ROW, stopCol).value = "停";
      ws.getCell(HEADER_ROW, mourningCol).value = "忌";
      ws.getCell(HEADER_ROW, absentOnlyCol).value = "欠";
      ws.getCell(HEADER_ROW, homeCol).value = "ホ";
      ws.getCell(HEADER_ROW, beforeMainSpacerCol).value = "";
      ws.getCell(HEADER_ROW, stopMourningCol).value = "停・忌";
      ws.getCell(HEADER_ROW, absentCol).value = "欠時";

      // NEW headers
      ws.getCell(HEADER_ROW, spacerCol).value = ""; // blank column
      ws.getCell(HEADER_ROW, totalHoursCol).value = "総授業時数"; // you can rename later
      ws.getCell(HEADER_ROW, afterTotalSpacerCol).value = ""; // blank column
      const baseHeaderCell = ws.getCell(HEADER_ROW, baseHoursCol);

      baseHeaderCell.value = "基準時数"; // \n makes the next line in the SAME cell
      baseHeaderCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      ws.getCell(FIRST_STUDENT_ROW, baseHoursCol).value = 100;
      const baseHoursCell = ws.getCell(FIRST_STUDENT_ROW, baseHoursCol);
      const baseHoursRef = baseHoursCell.address.replace(
        /([A-Z]+)(\d+)/,
        "$$$1$$$2",
      ); // makes $AB$2
      // widths
      ws.getColumn(1).width = 10; // Student #
      ws.getColumn(2).width = 18; // Student Name
      for (let i = 0; i < dateHeaders.length; i++)
        ws.getColumn(firstDateCol + i).width = 10;

      ws.getColumn(stopCol).width = 6;
      ws.getColumn(mourningCol).width = 6;
      ws.getColumn(absentOnlyCol).width = 6;
      ws.getColumn(homeCol).width = 6;
      ws.getColumn(beforeMainSpacerCol).width = 6;
      ws.getColumn(stopMourningCol).width = 8;
      ws.getColumn(absentCol).width = 6;

      ws.getColumn(spacerCol).width = 3;
      ws.getColumn(totalHoursCol).width = 14;
      ws.getColumn(afterTotalSpacerCol).width = 3;
      ws.getColumn(baseHoursCol).width = 12;
      // --- rows ---
      for (
        let row = FIRST_STUDENT_ROW;
        row < FIRST_STUDENT_ROW + NUM_STUDENTS;
        row++
      ) {
        ws.getCell(row, 1).value = row - HEADER_ROWS; // 5->1, 6->2, ...
        ws.getCell(row, 2).value = ""; // Student Name blank

        for (let i = 0; i < dateHeaders.length; i++) {
          const col = firstDateCol + i;
          ws.getCell(row, col).value = " ";
          ws.getCell(row, col).dataValidation = {
            type: "list",
            allowBlank: true,

            // use the range we created above (Lists!$A$1:$A$4)
            formulae: [attendanceRange],

            // //makes Excel block bad values
            // showErrorMessage: true,
            // errorStyle: "error", // Excel “Stop” behavior in practice
            // errorTitle: "Invalid input",
            // error: "Use the dropdown only: 忌 / 停 / 公 / 欠 (or leave blank).",

            // // show a helpful tooltip when the cell is selected
            // showInputMessage: true,
            // promptTitle: "Attendance code",
            // prompt: "Choose one of: 忌, 停, 公, 欠. Leave blank if normal.",
            showErrorMessage: true,
            errorStyle: "error", // Excel “Stop” behavior in practice
            errorTitle: "入力エラー",
            error:
              "プルダウンからのみ選択してください：忌 / 停 / 公 / 欠（または空欄のまま）。",

            // optional: show a helpful tooltip when the cell is selected
            showInputMessage: true,
            promptTitle: "出欠コード",
            prompt:
              "忌・停・公・欠 のいずれかを選択してください。通常は空欄のままでOKです。",
          };
        }

        const first = ws.getColumn(firstDateCol).letter;
        const last = ws.getColumn(firstDateCol + dateHeaders.length - 1).letter;
        ws.getCell(row, stopCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"停")`,
        };
        ws.getCell(row, mourningCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"忌")`,
        };
        ws.getCell(row, absentOnlyCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"欠")`,
        };
        ws.getCell(row, homeCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"ホ")`,
        };
        ws.getCell(row, stopMourningCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"停")+COUNTIF(${first}${row}:${last}${row},"忌")`,
        };
        ws.getCell(row, absentCol).value = {
          formula: `COUNTIF(${first}${row}:${last}${row},"ホ")+COUNTIF(${first}${row}:${last}${row},"欠")`,
        };
        const stopMourningCellAddress = ws.getCell(
          row,
          stopMourningCol,
        ).address;
        ws.getCell(row, totalHoursCol).value = {
          formula: `${baseHoursRef}-${stopMourningCellAddress}`,
        };
      }
      const thinBorder = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      } as const;

      // Add borders to the NEW header cells
      [spacerCol, totalHoursCol, afterTotalSpacerCol, baseHoursCol].forEach(
        (col) => {
          ws.getCell(HEADER_ROW, col).border = thinBorder;
        },
      );

      // Add border to the editable number cell (the 100 cell)
      ws.getCell(FIRST_STUDENT_ROW, baseHoursCol).border = thinBorder;

      // --- conditional formatting (same as before) ---

      const totalColLetter = ws.getColumn(totalHoursCol).letter;
      const totalHoursRange = `${totalColLetter}${FIRST_STUDENT_ROW}:${totalColLetter}${lastRow}`;
      const studentNameRange = `B${FIRST_STUDENT_ROW}:B${lastRow}`;

      // temporary debug so you can verify the ranges

      const lastDateCol = 2 + dateHeaders.length;
      const stopColLetter = ws.getColumn(stopCol).letter;
      const mourningColLetter = ws.getColumn(mourningCol).letter;
      const absentOnlyColLetter = ws.getColumn(absentOnlyCol).letter;
      const homeColLetter = ws.getColumn(homeCol).letter;
      const absentColLetter = ws.getColumn(absentCol).letter;
      const stopMourningColLetter = ws.getColumn(stopMourningCol).letter;

      const stopCountRange = `${stopColLetter}${FIRST_STUDENT_ROW}:${stopColLetter}${lastRow}`;
      const mourningCountRange = `${mourningColLetter}${FIRST_STUDENT_ROW}:${mourningColLetter}${lastRow}`;
      const absentOnlyCountRange = `${absentOnlyColLetter}${FIRST_STUDENT_ROW}:${absentOnlyColLetter}${lastRow}`;
      const homeCountRange = `${homeColLetter}${FIRST_STUDENT_ROW}:${homeColLetter}${lastRow}`;
      const stopMourningCountRange = `${stopMourningColLetter}${FIRST_STUDENT_ROW}:${stopMourningColLetter}${lastRow}`;

      const absentCountRange = `${absentColLetter}${FIRST_STUDENT_ROW}:${absentColLetter}${lastRow}`;

      // temporary: so you can see the ranges in your browser console

      ws.addConditionalFormatting({
        ref: `B${FIRST_STUDENT_ROW}:${ws.getColumn(lastDateCol).letter}${lastRow}`,
        rules: [
          {
            type: "containsText",
            operator: "containsText",
            text: "忌",
            priority: 1,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFC7CE" },
              },
            },
          },
          {
            type: "containsText",
            operator: "containsText",
            text: "停",
            priority: 2,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFF2CC" },
              },
            },
          },
          {
            type: "containsText",
            operator: "containsText",
            text: "公",
            priority: 3,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFBDD7EE" },
              },
            },
          },
          {
            type: "containsText",
            operator: "containsText",
            text: "ホ",
            priority: 5,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFFF99" },
              },
            },
          },
          {
            type: "containsText",
            operator: "containsText",
            text: "欠",
            priority: 4,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFD9EAD3" },
              },
            },
          },
        ],
      });
      ws.addConditionalFormatting({
        ref: stopCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 10,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFF2CC" },
              }, // same as "停"
            },
          },
        ],
      });
      ws.addConditionalFormatting({
        ref: mourningCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 10,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFC7CE" },
              },
            },
          },
        ],
      });
      ws.addConditionalFormatting({
        ref: absentOnlyCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 10,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFD9EAD3" },
              },
            },
          },
        ],
      });
      ws.addConditionalFormatting({
        ref: homeCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 10,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFFF99" },
              },
            },
          },
        ],
      });
      ws.addConditionalFormatting({
        ref: absentCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 11,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFFFC0CB" },
              },
            },
          },
        ],
      });

      ws.addConditionalFormatting({
        ref: totalHoursRange,
        rules: [
          {
            type: "expression",
            formulae: [
              `${totalColLetter}${FIRST_STUDENT_ROW}<>${baseHoursRef}`,
            ],
            priority: 20,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFEDE7F6" },
              },
            },
          },
        ],
      });

      ws.addConditionalFormatting({
        ref: studentNameRange, // "B2:B43"
        rules: [
          {
            type: "expression",
            // For B2, check the total-hours cell on the same row (e.g., K2) against base hours (e.g., $M$2).
            // When Excel applies it to B3, it becomes K3<>$M$2 automatically.
            formulae: [
              `$${totalColLetter}${FIRST_STUDENT_ROW}<>${baseHoursRef}`,
            ],
            priority: 21,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFEDE7F6" },
              },
            },
          },
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

      for (let r = 1; r <= lastRow; r++) {
        ws.getCell(r, beforeMainSpacerCol).border = {};
      }
      ws.addConditionalFormatting({
        ref: stopMourningCountRange,
        rules: [
          {
            type: "cellIs",
            operator: "greaterThan",
            formulae: [0],
            priority: 10,
            style: {
              fill: {
                type: "pattern",
                pattern: "solid",
                bgColor: { argb: "FFEDE7F6" },
              },
            },
          },
        ],
      });
      for (let r = 1; r <= lastRow; r++) {
        const cell = ws.getCell(r, totalHoursCol);
        applyThinBorder(cell);
        applyCenter(cell);
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
  const t = useTranslations("Export");
  return (
    <Button onClick={handleExport} variant="default" className="w-65">
      <IoDownloadOutline />
      {t("attendance")}
    </Button>
  );
}

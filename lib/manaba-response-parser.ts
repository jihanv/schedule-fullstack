import { read, set_cptable, utils } from "xlsx";

import * as cptable from "xlsx/dist/cpexcel.full.mjs";

set_cptable(cptable);

export type StudentAnswer = {
  header: string;
  label: string;
  value: string;
};

export type StudentResponse = {
  studentId: string;
  japaneseName: string;
  englishName: string;
  submissionStatus: string;
  answers: StudentAnswer[];
};

export type ParsedResponseFile = {
  sheetName: string;
  answerHeaders: string[];
  students: StudentResponse[];
  hasSubmittedColumn: boolean;
};

const HEADER_ALIASES = {
  studentId: ["# Student ID", "# 学籍番号"],

  japaneseName: ["# Name", "# 氏名"],

  englishName: ["# Name(en)", "# 氏名（英語）", "# 氏名(英語)"],

  submitted: ["# Submitted", "# 提出"],
} as const;

function cleanCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("_x000D_", "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeHeader(value: unknown): string {
  return cleanCell(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactHeader(value: unknown): string {
  return normalizeHeader(value).replace(/\s+/g, "");
}

function isResponseHeader(value: unknown): boolean {
  const header = compactHeader(value);

  return (
    header.startsWith("#answered") ||
    header.startsWith("#回答") ||
    header === "#text" ||
    header === "#テキスト"
  );
}

function responseLabel(header: string): string {
  const compact = compactHeader(header);

  if (compact === "#text") {
    return "Text";
  }

  if (compact === "#テキスト") {
    return "テキスト";
  }

  const label = cleanCell(header)
    .normalize("NFKC")
    .replace(/^#\s*(answered|回答)\s*/i, "")
    .trim();

  return label || header;
}

function findColumn(headers: unknown[], aliases: readonly string[]): number {
  const normalizedAliases = aliases.map(compactHeader);

  return headers.findIndex((header) =>
    normalizedAliases.includes(compactHeader(header)),
  );
}

function decodeCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bytes);
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
}

function normalizeSubmissionStatus(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, "").trim().toLowerCase();
}

export function isSubmittedStatus(value: string): boolean {
  const status = normalizeSubmissionStatus(value);

  if (!status) {
    return false;
  }

  const explicitlyNotSubmitted = ["notsubmitted", "unsubmitted", "未提出"];

  if (explicitlyNotSubmitted.includes(status)) {
    return false;
  }

  if (status.startsWith("未提出")) {
    return false;
  }

  /*
   * Treat any other nonempty status as submitted.
   *
   * This supports values such as:
   *
   * Submitted
   * 提出
   * 提出済
   * 提出済み
   */
  return true;
}

export async function parseResponseFile(
  file: File,
): Promise<ParsedResponseFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["xls", "xlsx", "csv"].includes(extension)) {
    throw new Error("Please select an .xls, .xlsx, or .csv file.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const workbook =
    extension === "csv"
      ? read(decodeCsv(bytes), {
          type: "string",
        })
      : read(bytes, {
          type: "array",
        });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The file does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error("The first worksheet could not be read.");
  }

  const rows = utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  const headerRowIndex = rows.findIndex((row) => {
    const hasStudentId = findColumn(row, HEADER_ALIASES.studentId) >= 0;

    const hasResponse = row.some(isResponseHeader);

    return hasStudentId && hasResponse;
  });

  if (headerRowIndex < 0) {
    throw new Error(
      "Could not find a supported Manaba header row. The file must contain a student ID column and either an answer or text column.",
    );
  }

  const headers = rows[headerRowIndex] ?? [];

  const studentIdColumn = findColumn(headers, HEADER_ALIASES.studentId);

  const japaneseNameColumn = findColumn(headers, HEADER_ALIASES.japaneseName);

  const englishNameColumn = findColumn(headers, HEADER_ALIASES.englishName);

  const submittedColumn = findColumn(headers, HEADER_ALIASES.submitted);

  const responseColumns = headers
    .map((header, index) => ({
      header: cleanCell(header),
      index,
    }))
    .filter(({ header }) => isResponseHeader(header));

  const students: StudentResponse[] = [];

  for (const row of rows.slice(headerRowIndex + 1)) {
    const firstCell = cleanCell(row[0]);

    if (firstCell.toLowerCase() === "#end") {
      break;
    }

    const answers = responseColumns
      .map(({ header, index }) => ({
        header,

        label: responseLabel(header),

        value: cleanCell(row[index]),
      }))
      .filter(({ value }) => value.length > 0);

    if (answers.length === 0) {
      continue;
    }

    students.push({
      studentId: studentIdColumn >= 0 ? cleanCell(row[studentIdColumn]) : "",

      japaneseName:
        japaneseNameColumn >= 0 ? cleanCell(row[japaneseNameColumn]) : "",

      englishName:
        englishNameColumn >= 0 ? cleanCell(row[englishNameColumn]) : "",

      submissionStatus:
        submittedColumn >= 0 ? cleanCell(row[submittedColumn]) : "",

      answers,
    });
  }

  if (students.length === 0) {
    throw new Error("No rows containing student responses were found.");
  }

  return {
    sheetName,

    answerHeaders: responseColumns.map(({ header }) => header),

    students,

    hasSubmittedColumn: submittedColumn >= 0,
  };
}

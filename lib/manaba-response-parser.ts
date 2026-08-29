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
  return cleanCell(value).replace(/\s+/g, " ").toLowerCase();
}

function isAnswerHeader(value: unknown): boolean {
  const header = normalizeHeader(value);

  return header.startsWith("# answered") || header === "# text";
}

function answerLabel(header: string): string {
  const normalized = normalizeHeader(header);

  if (normalized === "# text") {
    return "Text";
  }

  return header.replace(/^#\s*answered\s*/i, "").trim() || header;
}

function findColumn(headers: unknown[], expectedHeader: string): number {
  const normalizedExpected = normalizeHeader(expectedHeader);

  return headers.findIndex(
    (header) => normalizeHeader(header) === normalizedExpected,
  );
}

function decodeCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
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
      ? read(decodeCsv(bytes), { type: "string" })
      : read(bytes, { type: "array" });

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
    const hasStudentId = findColumn(row, "# Student ID") >= 0;
    const hasAnswer = row.some(isAnswerHeader);

    return hasStudentId && hasAnswer;
  });

  if (headerRowIndex < 0) {
    throw new Error(
      'Could not find a header row containing "# Student ID" and at least one "# answered ..." or "# Text" column.',
    );
  }

  const headers = rows[headerRowIndex] ?? [];

  const studentIdColumn = findColumn(headers, "# Student ID");
  const japaneseNameColumn = findColumn(headers, "# Name");
  const englishNameColumn = findColumn(headers, "# Name(en)");
  const submittedColumn = findColumn(headers, "# Submitted");

  const answerColumns = headers
    .map((header, index) => ({
      header: cleanCell(header),
      index,
    }))
    .filter(({ header }) => isAnswerHeader(header));

  const students: StudentResponse[] = [];

  for (const row of rows.slice(headerRowIndex + 1)) {
    if (cleanCell(row[0]).toLowerCase() === "#end") {
      break;
    }

    const answers = answerColumns
      .map(({ header, index }) => ({
        header,
        label: answerLabel(header),
        value: cleanCell(row[index]),
      }))
      .filter(({ value }) => value.length > 0);

    if (answers.length === 0) {
      continue;
    }

    students.push({
      studentId: cleanCell(row[studentIdColumn]),

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
    answerHeaders: answerColumns.map(({ header }) => header),
    students,
    hasSubmittedColumn: submittedColumn >= 0,
  };
}

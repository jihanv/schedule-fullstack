import {
  Document,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";

import type { StudentResponse } from "@/lib/manaba-response-parser";

const FONT_NAME = "Yu Gothic";

// DOCX font sizes use half-points.
// Therefore, 24 means 12 points.
const FONT_SIZE = 24;

const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN_1_5_CM = 850;

type CreateCombinedDocxOptions = {
  showResponseLabels: boolean;
};

function formatStudentId(studentId: string): string {
  const digits = studentId.replace(/\D/g, "");

  if (digits.length < 3) {
    return studentId;
  }

  const grade = digits[0];
  const classNumber = digits[1];
  const studentNumber = String(Number.parseInt(digits.slice(2), 10));

  return `${grade}年${classNumber}組${studentNumber}番`;
}

function textRun(text: string, bold = false): TextRun {
  return new TextRun({
    text,
    bold,
    font: FONT_NAME,
    size: FONT_SIZE,
  });
}

function metadataParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 240,
      lineRule: LineRuleType.AUTO,
    },
    children: [textRun(text)],
  });
}

function blankParagraph(): Paragraph {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 240,
      lineRule: LineRuleType.AUTO,
    },
  });
}

function responseParagraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 360,
      lineRule: LineRuleType.AUTO,
    },
    children: [textRun(text, bold)],
  });
}

function createStudentParagraphs(
  student: StudentResponse,
  showResponseLabels: boolean,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const studentLabel = formatStudentId(student.studentId);

  if (studentLabel) {
    paragraphs.push(metadataParagraph(studentLabel));
  }

  if (student.japaneseName) {
    paragraphs.push(metadataParagraph(student.japaneseName));
  }

  paragraphs.push(blankParagraph());

  student.answers.forEach((answer, answerIndex) => {
    if (showResponseLabels) {
      paragraphs.push(responseParagraph(answer.label, true));

      paragraphs.push(blankParagraph());
    }

    const lines = answer.value.split("\n");

    lines.forEach((line) => {
      paragraphs.push(responseParagraph(line));
    });

    if (answerIndex < student.answers.length - 1) {
      paragraphs.push(blankParagraph());
    }
  });

  return paragraphs;
}

export async function createCombinedDocx(
  students: StudentResponse[],
  options: CreateCombinedDocxOptions,
): Promise<Blob> {
  const children: Paragraph[] = [];

  students.forEach((student, index) => {
    if (index > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
      );
    }

    children.push(
      ...createStudentParagraphs(student, options.showResponseLabels),
    );
  });

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: A4_WIDTH,
              height: A4_HEIGHT,
            },
            margin: {
              top: MARGIN_1_5_CM,
              right: MARGIN_1_5_CM,
              bottom: MARGIN_1_5_CM,
              left: MARGIN_1_5_CM,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

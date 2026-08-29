import {
  Document,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";

import type { StudentResponse } from "@/lib/manaba-response-parser";

export const JAPANESE_FONT_OPTIONS = [
  {
    value: "Yu Gothic",
    label: "游ゴシック (Yu Gothic)",
  },
  {
    value: "Yu Mincho",
    label: "游明朝 (Yu Mincho)",
  },
  {
    value: "Meiryo",
    label: "メイリオ (Meiryo)",
  },
  {
    value: "MS Gothic",
    label: "ＭＳ ゴシック (MS Gothic)",
  },
  {
    value: "MS Mincho",
    label: "ＭＳ 明朝 (MS Mincho)",
  },
] as const;

export type JapaneseFontName = (typeof JAPANESE_FONT_OPTIONS)[number]["value"];

export type PaperSize = "a4" | "b5" | "letter";

export type DocumentMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type CreateCombinedDocxOptions = {
  showResponseLabels: boolean;
  fontName: JapaneseFontName;
  fontSizePt: number;
  paperSize: PaperSize;
  marginsCm: DocumentMargins;
};

const PAPER_SIZES: Record<
  PaperSize,
  {
    width: number;
    height: number;
  }
> = {
  a4: {
    width: 11906,
    height: 16838,
  },

  // Japanese Industrial Standards B5:
  // 182 mm × 257 mm
  b5: {
    width: 10318,
    height: 14570,
  },

  letter: {
    width: 12240,
    height: 15840,
  },
};

function centimetersToTwips(centimeters: number): number {
  const safeValue = Math.max(0, centimeters);

  return Math.round((safeValue / 2.54) * 1440);
}

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

function textRun(
  text: string,
  options: CreateCombinedDocxOptions,
  bold = false,
): TextRun {
  return new TextRun({
    text,
    bold,

    // DOCX font sizes use half-points.
    // For example, 12 pt becomes 24.
    size: Math.round(options.fontSizePt * 2),

    // Explicitly set the font for both Japanese
    // and Latin characters.
    font: {
      ascii: options.fontName,
      hAnsi: options.fontName,
      eastAsia: options.fontName,
      cs: options.fontName,
    },
  });
}

function metadataParagraph(
  text: string,
  options: CreateCombinedDocxOptions,
): Paragraph {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 240,
      lineRule: LineRuleType.AUTO,
    },

    children: [textRun(text, options)],
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

function responseParagraph(
  text: string,
  options: CreateCombinedDocxOptions,
  bold = false,
): Paragraph {
  return new Paragraph({
    spacing: {
      before: 0,
      after: 0,
      line: 360,
      lineRule: LineRuleType.AUTO,
    },

    children: [textRun(text, options, bold)],
  });
}

function createStudentParagraphs(
  student: StudentResponse,
  options: CreateCombinedDocxOptions,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const studentLabel = formatStudentId(student.studentId);

  if (studentLabel) {
    paragraphs.push(metadataParagraph(studentLabel, options));
  }

  // Only include the Japanese name.
  if (student.japaneseName) {
    paragraphs.push(metadataParagraph(student.japaneseName, options));
  }

  paragraphs.push(blankParagraph());

  student.answers.forEach((answer, answerIndex) => {
    if (options.showResponseLabels) {
      paragraphs.push(responseParagraph(answer.label, options, true));

      paragraphs.push(blankParagraph());
    }

    const lines = answer.value.split("\n");

    lines.forEach((line) => {
      paragraphs.push(responseParagraph(line, options));
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

    children.push(...createStudentParagraphs(student, options));
  });

  const selectedPaperSize = PAPER_SIZES[options.paperSize];

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: selectedPaperSize.width,
              height: selectedPaperSize.height,
            },

            margin: {
              top: centimetersToTwips(options.marginsCm.top),

              right: centimetersToTwips(options.marginsCm.right),

              bottom: centimetersToTwips(options.marginsCm.bottom),

              left: centimetersToTwips(options.marginsCm.left),
            },
          },
        },

        children,
      },
    ],
  });

  return Packer.toBlob(document);
}

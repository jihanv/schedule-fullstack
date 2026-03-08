"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type ConversionResult = {
  normalized: string;
  romaji: string;
};

type KatakanaRomajiConverterProps = {
  initialValue?: string;
  title?: string;
  description?: string;
};

type OutputPanelProps = {
  label: string;
  value: string;
};

const digraphMap: Record<string, string> = {
  キャ: "kya",
  キュ: "kyu",
  キョ: "kyo",
  ギャ: "gya",
  ギュ: "gyu",
  ギョ: "gyo",
  シャ: "sha",
  シュ: "shu",
  ショ: "sho",
  ジャ: "ja",
  ジュ: "ju",
  ジョ: "jo",
  チャ: "cha",
  チュ: "chu",
  チョ: "cho",
  ヂャ: "ja",
  ヂュ: "ju",
  ヂョ: "jo",
  ニャ: "nya",
  ニュ: "nyu",
  ニョ: "nyo",
  ヒャ: "hya",
  ヒュ: "hyu",
  ヒョ: "hyo",
  ビャ: "bya",
  ビュ: "byu",
  ビョ: "byo",
  ピャ: "pya",
  ピュ: "pyu",
  ピョ: "pyo",
  ミャ: "mya",
  ミュ: "myu",
  ミョ: "myo",
  リャ: "rya",
  リュ: "ryu",
  リョ: "ryo",
  シェ: "she",
  ジェ: "je",
  チェ: "che",
  ティ: "ti",
  ディ: "di",
  トゥ: "tu",
  ドゥ: "du",
  ツァ: "tsa",
  ツィ: "tsi",
  ツェ: "tse",
  ツォ: "tso",
  ファ: "fa",
  フィ: "fi",
  フェ: "fe",
  フォ: "fo",
  ウィ: "wi",
  ウェ: "we",
  ウォ: "wo",
  ヴァ: "va",
  ヴィ: "vi",
  ヴ: "vu",
  ヴェ: "ve",
  ヴォ: "vo",
};

const charMap: Record<string, string> = {
  ア: "a",
  イ: "i",
  ウ: "u",
  エ: "e",
  オ: "o",
  カ: "ka",
  キ: "ki",
  ク: "ku",
  ケ: "ke",
  コ: "ko",
  ガ: "ga",
  ギ: "gi",
  グ: "gu",
  ゲ: "ge",
  ゴ: "go",
  サ: "sa",
  シ: "shi",
  ス: "su",
  セ: "se",
  ソ: "so",
  ザ: "za",
  ジ: "ji",
  ズ: "zu",
  ゼ: "ze",
  ゾ: "zo",
  タ: "ta",
  チ: "chi",
  ツ: "tsu",
  テ: "te",
  ト: "to",
  ダ: "da",
  ヂ: "ji",
  ヅ: "zu",
  デ: "de",
  ド: "do",
  ナ: "na",
  ニ: "ni",
  ヌ: "nu",
  ネ: "ne",
  ノ: "no",
  ハ: "ha",
  ヒ: "hi",
  フ: "fu",
  ヘ: "he",
  ホ: "ho",
  バ: "ba",
  ビ: "bi",
  ブ: "bu",
  ベ: "be",
  ボ: "bo",
  パ: "pa",
  ピ: "pi",
  プ: "pu",
  ペ: "pe",
  ポ: "po",
  マ: "ma",
  ミ: "mi",
  ム: "mu",
  メ: "me",
  モ: "mo",
  ヤ: "ya",
  ユ: "yu",
  ヨ: "yo",
  ラ: "ra",
  リ: "ri",
  ル: "ru",
  レ: "re",
  ロ: "ro",
  ワ: "wa",
  ヲ: "o",
  ン: "n",
  ァ: "a",
  ィ: "i",
  ゥ: "u",
  ェ: "e",
  ォ: "o",
  ャ: "ya",
  ュ: "yu",
  ョ: "yo",
  ヮ: "wa",
  "　": " ",
};

function normalizeKatakana(text: string): string {
  return text.normalize("NFKC");
}

function initialConsonant(romaji: string): string {
  const match = romaji.match(/^[^aeiou]+/);
  return match ? match[0] : "";
}

function applyLongVowel(previousRomaji: string): string {
  if (!previousRomaji) return "-";

  const match = previousRomaji.match(/[aeiou](?!.*[aeiou])/);
  return match ? match[0] : "-";
}

function titleCaseLine(line: string): string {
  let output = "";
  let capitalizeNext = true;

  for (const char of line) {
    const isAsciiLetter = char >= "a" && char <= "z";

    if (capitalizeNext && isAsciiLetter) {
      output += char.toUpperCase();
      capitalizeNext = false;
      continue;
    }

    output += char;

    if (char === " " || char === "-" || char === "'") {
      capitalizeNext = true;
    } else if (isAsciiLetter) {
      capitalizeNext = false;
    }
  }

  return output;
}

function katakanaToRomajiLine(line: string): string {
  let result = "";
  let index = 0;

  while (index < line.length) {
    const current = line[index] ?? "";
    const next = line[index + 1] ?? "";
    const pair = current + next;

    if (current === "ッ") {
      const nextPair = (line[index + 1] ?? "") + (line[index + 2] ?? "");
      const nextRomaji = digraphMap[nextPair] || charMap[next] || "";
      result += initialConsonant(nextRomaji);
      index += 1;
      continue;
    }

    if (digraphMap[pair]) {
      result += digraphMap[pair];
      index += 2;
      continue;
    }

    if (current === "ー") {
      result += applyLongVowel(result);
      index += 1;
      continue;
    }

    result += charMap[current] ?? current;
    index += 1;
  }

  return result;
}

function convertText(text: string): ConversionResult {
  const normalized = normalizeKatakana(text);
  const romaji = normalized
    .split("\n")
    .map((line) => titleCaseLine(katakanaToRomajiLine(line)))
    .join("\n");

  return { normalized, romaji };
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
      {children}
    </label>
  );
}

function OutputPanel({ label, value }: OutputPanelProps) {
  return (
    <Card>
      <SectionLabel>{label}</SectionLabel>
      <pre className="h-72 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm whitespace-pre-wrap wrap-break-word text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {value}
      </pre>
    </Card>
  );
}

export default function KatakanaRomajiConverter({
  initialValue = "ｶﾀｶﾅ\nスーパー",
}: KatakanaRomajiConverterProps) {
  const [input, setInput] = useState<string>(initialValue);
  const t = useTranslations("KatakanaConverter");
  const [copyLabel, setCopyLabel] = useState<string>(t("copyButton"));

  const { romaji } = useMemo<ConversionResult>(
    () => convertText(input),
    [input],
  );

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(romaji);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel(t("copyButton")), 1200);
    } catch {
      setCopyLabel("Copy Failed");
      window.setTimeout(() => setCopyLabel(t("copyButton")), 1200);
    }
  }

  function handleClear(): void {
    setInput("");
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card>
            <SectionLabel>{t("inputLabel")}</SectionLabel>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={"ｶﾀｶﾅ"}
              className="min-h-70 w-full rounded-2xl  border border-slate-300 bg-transparent p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
            />
          </Card>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-2xl border mt-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>

        <div>
          <OutputPanel label={t("outputLabel")} value={romaji} />
          <button
            type="button"
            onClick={handleCopy}
            className="w-40 mt-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-slate-100 dark:text-slate-900"
          >
            {copyLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

export { convertText, normalizeKatakana, katakanaToRomajiLine, titleCaseLine };

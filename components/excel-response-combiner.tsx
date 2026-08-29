"use client";

import { Download, FileSpreadsheet, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createCombinedDocx,
  JAPANESE_FONT_OPTIONS,
  type DocumentMargins,
  type JapaneseFontName,
  type PaperSize,
} from "@/lib/create-combined-docx";
import {
  isSubmittedStatus,
  parseResponseFile,
  type ParsedResponseFile,
} from "@/lib/manaba-response-parser";

const ACCEPTED_EXTENSIONS = ["xls", "xlsx", "csv"];

function createOutputFilename(inputFilename: string): string {
  const base = inputFilename.replace(/\.(xlsx|xls|csv)$/i, "");

  const safeBase = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");

  return `${safeBase || "student_responses"}_combined.docx`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {children}
    </div>
  );
}

export default function ExcelResponseCombiner() {
  const t = useTranslations("ExcelResponseCombiner");

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [parsed, setParsed] = useState<ParsedResponseFile | null>(null);

  const [submittedOnly, setSubmittedOnly] = useState(true);

  const [showResponseLabels, setShowResponseLabels] = useState(false);
  const [fontName, setFontName] = useState<JapaneseFontName>("Yu Gothic");

  const [fontSizePt, setFontSizePt] = useState(12);

  const [paperSize, setPaperSize] = useState<PaperSize>("a4");

  const [marginsCm, setMarginsCm] = useState<DocumentMargins>({
    top: 1.5,
    right: 1.5,
    bottom: 1.5,
    left: 1.5,
  });
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState("");

  const includedStudents = useMemo(() => {
    if (!parsed) {
      return [];
    }

    if (!submittedOnly || !parsed.hasSubmittedColumn) {
      return parsed.students;
    }

    return parsed.students.filter((student) =>
      isSubmittedStatus(student.submissionStatus),
    );
  }, [parsed, submittedOnly]);

  async function processFile(selectedFile: File | null): Promise<void> {
    setError("");
    setParsed(null);
    setFile(selectedFile);

    if (!selectedFile) {
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setError(t("errors.unsupportedFile"));
      return;
    }

    setIsReading(true);

    try {
      const result = await parseResponseFile(selectedFile);

      setParsed(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("errors.couldNotRead"),
      );
    } finally {
      setIsReading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedFile = event.target.files?.[0] ?? null;

    void processFile(selectedFile);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files.item(0);

    void processFile(droppedFile);
  }

  function handleRemoveFile(): void {
    setFile(null);
    setParsed(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }
  function handleMarginChange(
    side: keyof DocumentMargins,
    value: string,
  ): void {
    const numericValue = Number(value);

    setMarginsCm((currentMargins) => ({
      ...currentMargins,

      [side]: Number.isFinite(numericValue) ? numericValue : 0,
    }));
  }

  async function handleGenerate(): Promise<void> {
    if (!file || !parsed) {
      return;
    }

    if (includedStudents.length === 0) {
      setError(t("errors.noIncludedStudents"));
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const blob = await createCombinedDocx(includedStudents, {
        showResponseLabels,
        fontName,
        fontSizePt,
        paperSize,
        marginsCm,
      });

      downloadBlob(blob, createOutputFilename(file.name));
    } catch {
      setError(t("errors.couldNotGenerate"));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("title")}
        </h1>

        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      <Card>
        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("fileLabel")}
        </label>

        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          onChange={handleFileChange}
          className="sr-only"
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-slate-700 transition dark:text-slate-200 ${
              isDragging
                ? "border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800"
                : "border-slate-300 hover:border-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="pointer-events-none size-9" />

            <span className="pointer-events-none font-semibold">
              {t("chooseFile")}
            </span>

            <span className="pointer-events-none text-xs text-slate-500 dark:text-slate-400">
              {t("acceptedFiles")}
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex min-w-0 items-center gap-3">
              <FileSpreadsheet className="size-6 shrink-0" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {file.name}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isReading ? t("reading") : t("fileReady")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isReading || isGenerating}
              aria-label={t("removeFile")}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {isReading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="size-4 animate-spin" />
            {t("reading")}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </Card>

      {parsed && (
        <>
          <Card>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("detectedTitle")}
            </h2>

            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t("worksheet")}
                </dt>

                <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {parsed.sheetName}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t("studentsFound")}
                </dt>

                <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {parsed.students.length}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t("answerColumnsFound")}
                </dt>

                <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {parsed.answerHeaders.length}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {parsed.answerHeaders.map((header) => (
                <span
                  key={header}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {header}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("optionsTitle")}
            </h2>

            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={submittedOnly}
                  disabled={!parsed.hasSubmittedColumn}
                  onChange={(event) => setSubmittedOnly(event.target.checked)}
                  className="mt-1 size-4"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("submittedOnly")}
                  </span>

                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {parsed.hasSubmittedColumn
                      ? t("submittedOnlyDescription")
                      : t("noSubmittedColumn")}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={showResponseLabels}
                  onChange={(event) =>
                    setShowResponseLabels(event.target.checked)
                  }
                  className="mt-1 size-4"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("showLabels")}
                  </span>

                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {t("showLabelsDescription")}
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t("formattingTitle")}
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("font")}
                  </span>

                  <select
                    value={fontName}
                    onChange={(event) =>
                      setFontName(event.target.value as JapaneseFontName)
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {JAPANESE_FONT_OPTIONS.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("fontSize")}
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="8"
                      max="48"
                      step="1"
                      value={fontSizePt}
                      onChange={(event) =>
                        setFontSizePt(Number(event.target.value))
                      }
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />

                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      pt
                    </span>
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("paperSize")}
                  </span>

                  <select
                    value={paperSize}
                    onChange={(event) =>
                      setPaperSize(event.target.value as PaperSize)
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="a4">{t("paperSizes.a4")}</option>

                    <option value="b5">{t("paperSizes.b5")}</option>

                    <option value="letter">{t("paperSizes.letter")}</option>
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("margins")}
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("marginsDescription")}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <label className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("marginTop")}
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={marginsCm.top}
                      onChange={(event) =>
                        handleMarginChange("top", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("marginRight")}
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={marginsCm.right}
                      onChange={(event) =>
                        handleMarginChange("right", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("marginBottom")}
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={marginsCm.bottom}
                      onChange={(event) =>
                        handleMarginChange("bottom", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("marginLeft")}
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={marginsCm.left}
                      onChange={(event) =>
                        handleMarginChange("left", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("studentsIncluded", {
                  count: includedStudents.length,
                })}
              </p>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || includedStudents.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}

                {isGenerating ? t("generating") : t("generateButton")}
              </button>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

const SVG_WIDTH = 720;
const SVG_HEIGHT = 420;

const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;

const RADIUS = 120;
const LEADER_BEND_RADIUS = 152;
const LEADER_HORIZONTAL = 42;

const INITIAL_SLICES = ["38", "32", "20", "10"];

type SliceInput = {
  id: number;
  value: string;
  label: string;
};

function pointOnCircle(angleDegrees: number, radius: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: CENTER_X + radius * Math.cos(radians),
    y: CENTER_Y + radius * Math.sin(radians),
  };
}

function createSlicePath(startAngle: number, endAngle: number) {
  const start = pointOnCircle(startAngle, RADIUS);
  const end = pointOnCircle(endAngle, RADIUS);

  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    `M ${CENTER_X} ${CENTER_Y}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PieChartGenerator() {
  const t = useTranslations("PieChartGenerator");

  const svgRef = useRef<SVGSVGElement>(null);
  const nextId = useRef(INITIAL_SLICES.length + 1);

  const [slices, setSlices] = useState<SliceInput[]>(
    INITIAL_SLICES.map((value, index) => ({
      id: index + 1,
      value,
      label: "",
    })),
  );

  const [showLeaderLines, setShowLeaderLines] = useState(true);
  const [showCategoryNames, setShowCategoryNames] = useState(false);
  const [showPercentages, setShowPercentages] = useState(false);

  const [textSize, setTextSize] = useState(16);
  const [lineWidth, setLineWidth] = useState(2);

  const validSlices = useMemo(
    () =>
      slices
        .map((slice) => ({
          ...slice,
          numericValue: Number(slice.value),
        }))
        .filter(
          (slice) =>
            Number.isFinite(slice.numericValue) && slice.numericValue > 0,
        ),
    [slices],
  );

  const total = useMemo(
    () => validSlices.reduce((sum, slice) => sum + slice.numericValue, 0),
    [validSlices],
  );

  const chartSlices = useMemo(() => {
    return validSlices.map((slice, index) => {
      const previousTotal = validSlices
        .slice(0, index)
        .reduce((sum, item) => sum + item.numericValue, 0);

      const startAngle = (previousTotal / total) * 360;
      const sweep = (slice.numericValue / total) * 360;

      const endAngle = startAngle + sweep;
      const midAngle = startAngle + sweep / 2;

      const leaderStart = pointOnCircle(midAngle, RADIUS);

      const leaderBend = pointOnCircle(midAngle, LEADER_BEND_RADIUS);

      const isRightSide = Math.cos(((midAngle - 90) * Math.PI) / 180) >= 0;

      const leaderEnd = {
        x:
          leaderBend.x + (isRightSide ? LEADER_HORIZONTAL : -LEADER_HORIZONTAL),
        y: leaderBend.y,
      };

      const insideLabel = pointOnCircle(midAngle, RADIUS * 0.62);

      return {
        ...slice,
        percentage: (slice.numericValue / total) * 100,
        path: createSlicePath(startAngle, endAngle),
        leaderPoints:
          `${leaderStart.x},${leaderStart.y} ` +
          `${leaderBend.x},${leaderBend.y} ` +
          `${leaderEnd.x},${leaderEnd.y}`,
        leaderEnd,
        insideLabel,
        textAnchor: isRightSide ? ("start" as const) : ("end" as const),
      };
    });
  }, [total, validSlices]);

  function updateSlice(id: number, value: string) {
    setSlices((current) =>
      current.map((slice) => (slice.id === id ? { ...slice, value } : slice)),
    );
  }

  function updateSliceLabel(id: number, label: string) {
    setSlices((current) =>
      current.map((slice) => (slice.id === id ? { ...slice, label } : slice)),
    );
  }

  function addSlice() {
    const id = nextId.current;

    nextId.current += 1;

    setSlices((current) => [
      ...current,
      {
        id,
        value: "10",
        label: "",
      },
    ]);
  }

  function removeSlice(id: number) {
    setSlices((current) => current.filter((slice) => slice.id !== id));
  }

  function resetExample() {
    nextId.current = INITIAL_SLICES.length + 1;

    setSlices(
      INITIAL_SLICES.map((value, index) => ({
        id: index + 1,
        value,
        label: "",
      })),
    );

    setShowLeaderLines(true);
    setShowCategoryNames(false);
    setShowPercentages(false);

    setTextSize(16);
    setLineWidth(2);
  }

  function serializeSvg() {
    if (!svgRef.current) {
      return null;
    }

    return new XMLSerializer().serializeToString(svgRef.current);
  }

  function downloadSvg() {
    if (!svgRef.current) {
      return;
    }

    const padding = 12;
    const bounds = svgRef.current.getBBox();
    const exportedSvg = svgRef.current.cloneNode(true) as SVGSVGElement;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    exportedSvg.setAttribute(
      "viewBox",
      `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`,
    );
    exportedSvg.setAttribute("width", String(width));
    exportedSvg.setAttribute("height", String(height));

    const source = new XMLSerializer().serializeToString(exportedSvg);

    const blob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>\n${source}`],
      {
        type: "image/svg+xml;charset=utf-8",
      },
    );

    downloadBlob(blob, "pie-chart.svg");
  }

  function downloadPng() {
    const source = serializeSvg();

    if (!source) {
      return;
    }

    const svgBlob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);

    const image = new Image();

    image.onload = () => {
      const scale = 4;

      const canvas = document.createElement("canvas");

      canvas.width = SVG_WIDTH * scale;

      canvas.height = SVG_HEIGHT * scale;

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.scale(scale, scale);

      context.fillStyle = "#ffffff";

      context.fillRect(0, 0, SVG_WIDTH, SVG_HEIGHT);

      context.drawImage(image, 0, 0, SVG_WIDTH, SVG_HEIGHT);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, "pie-chart.png");
        }
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
    };

    image.src = url;
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid items-start gap-6 min-[1150px]:grid-cols-[380px_minmax(0,1fr)]">
        {/* LEFT: EDITOR */}
        <div className="space-y-6">
          {/* COLLAPSIBLE CHART OPTIONS */}
          <Collapsible defaultOpen className="group/options">
            <Card className="gap-0 overflow-hidden py-0">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40">
                <span className="font-semibold">{t("optionsTitle")}</span>

                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/options:rotate-90"
                  aria-hidden="true"
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-5 border-t py-5">
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={showLeaderLines}
                        onChange={(event) =>
                          setShowLeaderLines(event.target.checked)
                        }
                        className="size-4"
                      />

                      {t("leaderLines")}
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={showCategoryNames}
                        onChange={(event) =>
                          setShowCategoryNames(event.target.checked)
                        }
                        className="size-4"
                      />

                      {t("categoryNames")}
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={showPercentages}
                        onChange={(event) =>
                          setShowPercentages(event.target.checked)
                        }
                        className="size-4"
                      />

                      {t("percentages")}
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 min-[1150px]:grid-cols-1">
                    {(showCategoryNames || showPercentages) && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="text-size"
                          className="text-sm font-medium"
                        >
                          {t("textSize")}
                        </label>

                        <Input
                          id="text-size"
                          type="number"
                          min="8"
                          max="48"
                          step="1"
                          value={textSize}
                          onChange={(event) => {
                            const value = Number(event.target.value);

                            if (Number.isFinite(value)) {
                              setTextSize(Math.min(48, Math.max(8, value)));
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="line-width"
                        className="text-sm font-medium"
                      >
                        {t("lineWidth")}
                      </label>

                      <Input
                        id="line-width"
                        type="number"
                        min="0.5"
                        max="8"
                        step="0.5"
                        value={lineWidth}
                        onChange={(event) => {
                          const value = Number(event.target.value);

                          if (Number.isFinite(value)) {
                            setLineWidth(Math.min(8, Math.max(0.5, value)));
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* COLLAPSIBLE SLICE VALUES */}
          <Collapsible defaultOpen className="group/slices">
            <Card className="gap-0 overflow-hidden py-0">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40">
                <span className="min-w-0 space-y-1">
                  <span className="block font-semibold">
                    {t("valuesTitle")}
                  </span>

                  <span className="block text-sm font-normal text-muted-foreground">
                    {t("valuesDescription")}
                  </span>
                </span>

                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/slices:rotate-90"
                  aria-hidden="true"
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-4 border-t py-5">
                  {slices.map((slice, index) => (
                    <div
                      key={slice.id}
                      className="space-y-3 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {t("slice", {
                            number: index + 1,
                          })}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlice(slice.id)}
                          disabled={slices.length <= 2}
                        >
                          {t("remove")}
                        </Button>
                      </div>

                      {showCategoryNames && (
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`slice-label-${slice.id}`}
                            className="text-sm font-medium"
                          >
                            {t("categoryName")}
                          </label>

                          <Input
                            id={`slice-label-${slice.id}`}
                            type="text"
                            value={slice.label}
                            placeholder={t("categoryPlaceholder")}
                            onChange={(event) =>
                              updateSliceLabel(slice.id, event.target.value)
                            }
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`slice-${slice.id}`}
                          className="text-sm font-medium"
                        >
                          {t("value")}
                        </label>

                        <Input
                          id={`slice-${slice.id}`}
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={slice.value}
                          onChange={(event) =>
                            updateSlice(slice.id, event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={addSlice}>
                      {t("addSlice")}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetExample}
                    >
                      {t("reset")}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("currentTotal", {
                      total: Number(total.toFixed(2)),
                    })}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* RIGHT: STICKY LIVE PREVIEW */}
        <div className="min-w-0 min-[1150px]:sticky min-[1150px]:top-4 min-[1150px]:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{t("previewTitle")}</CardTitle>

              <CardDescription>{t("previewDescription")}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex min-h-115 items-center justify-center overflow-auto rounded-xl border bg-white p-4">
                {chartSlices.length > 0 ? (
                  <svg
                    ref={svgRef}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    role="img"
                    aria-label={t("svgLabel")}
                    className="h-auto w-full"
                  >
                    <rect
                      width={SVG_WIDTH}
                      height={SVG_HEIGHT}
                      fill="#ffffff"
                    />

                    {chartSlices.length === 1 ? (
                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={RADIUS}
                        fill="#ffffff"
                        stroke="#000000"
                        strokeWidth={lineWidth}
                      />
                    ) : (
                      chartSlices.map((slice) => (
                        <path
                          key={`slice-${slice.id}`}
                          d={slice.path}
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth={lineWidth}
                          strokeLinejoin="round"
                        />
                      ))
                    )}

                    {chartSlices.length > 1 && (
                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={RADIUS}
                        fill="none"
                        stroke="#000000"
                        strokeWidth={lineWidth}
                      />
                    )}

                    {showLeaderLines &&
                      chartSlices.map((slice) => (
                        <polyline
                          key={`leader-${slice.id}`}
                          points={slice.leaderPoints}
                          fill="none"
                          stroke="#000000"
                          strokeWidth={lineWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}

                    {(showCategoryNames || showPercentages) &&
                      chartSlices.map((slice) => {
                        const useOutsidePosition =
                          showLeaderLines || showCategoryNames;

                        const x = useOutsidePosition
                          ? slice.leaderEnd.x +
                            (slice.textAnchor === "start" ? 7 : -7)
                          : slice.insideLabel.x;

                        const y = useOutsidePosition
                          ? slice.leaderEnd.y
                          : slice.insideLabel.y;

                        const categoryText = slice.label.trim();

                        const showCategory =
                          showCategoryNames && categoryText.length > 0;

                        const showPercentage = showPercentages;

                        if (!showCategory && !showPercentage) {
                          return null;
                        }

                        const percentageText = `${Number(
                          slice.percentage.toFixed(1),
                        )}%`;

                        return (
                          <text
                            key={`label-${slice.id}`}
                            x={x}
                            y={y}
                            fill="#000000"
                            fontFamily="'Times New Roman', Times, serif"
                            fontSize={textSize}
                            fontWeight="400"
                            textAnchor={
                              useOutsidePosition ? slice.textAnchor : "middle"
                            }
                          >
                            {showCategory && (
                              <tspan x={x} dy="0">
                                {categoryText}
                              </tspan>
                            )}

                            {showPercentage && (
                              <tspan x={x} dy={showCategory ? "1.15em" : "0"}>
                                {percentageText}
                              </tspan>
                            )}
                          </text>
                        );
                      })}
                  </svg>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("empty")}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={downloadSvg}
                  disabled={chartSlices.length === 0}
                >
                  {t("downloadSvg")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadPng}
                  disabled={chartSlices.length === 0}
                >
                  {t("downloadPng")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

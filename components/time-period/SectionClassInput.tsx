"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { BADGE_COLORS } from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";

export default function SectionNameInput() {
  const { sections, addSections, removeSection, setActivateNext } =
    useTimePeriodStore();
  const [newSection, setNewSection] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const t = useTranslations("SectionNameInput");
  useEffect(() => {
    setActivateNext(sections.length !== 0);

    if (!feedback) return;

    // show immediately

    // start fading near the end (adjust 2400 → taste)
    const fadeTimer = setTimeout(() => setFading(true), 2400);

    // fully clear after 3s total
    const clearTimer = setTimeout(() => {
      setFeedback(null);
      setFading(false); // reset for next time
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [feedback, sections, setActivateNext]);

  const handleAdd = () => {
    const raw = newSection.trim();
    if (!raw) return;

    const parts = raw
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(parts));

    // call the store for each section and collect results
    const results = unique.map((name) => ({
      name,
      ok: addSections(name),
    }));

    const added = results.filter((r) => r.ok).map((r) => r.name);
    const skipped = results.filter((r) => !r.ok).map((r) => r.name);

    let msg: string | null = null;

    if (added.length && !skipped.length) {
      msg = t("feedback.addedOnly", {
        count: added.length,
        names: added.join(", "),
      });
    } else if (added.length && skipped.length) {
      msg = t("feedback.addedAndSkipped", {
        addedCount: added.length,
        addedNames: added.join(", "),
        skippedCount: skipped.length,
        skippedNames: skipped.join(", "),
      });
    } else if (!added.length && skipped.length) {
      msg = t("feedback.skippedOnly", {
        skippedCount: skipped.length,
        skippedNames: skipped.join(", "),
      });
    }

    if (msg) {
      setFading(false); // 👈 reset BEFORE showing message
      setFeedback(msg);
    } else {
      setFeedback(null);
    }
    setActivateNext(true);
    setNewSection("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent full page reload
    if (newSection.trim() === "") return;
    handleAdd();
  };
  return (
    <>
      <Card>
        <div className="flex flex-col p-4 gap-4">
          {" "}
          <>
            <h1>{t("title")}</h1>
            <form onSubmit={handleSubmit} className="space-y-5 ">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  className="w-full"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder={t("placeholder")}
                />
                <Button
                  className="mt-auto"
                  type="submit"
                  disabled={!newSection.trim()}
                  onClick={handleAdd}
                >
                  {t("addButton")}
                </Button>
              </div>

              <p className="text-lg text-muted-foreground whitespace-pre-line">
                {t("instructions")}
              </p>
            </form>
            {/* Badges area */}
            <div className="mt-2 min-h-10 max-h-30 overflow-auto">
              <div className="flex flex-wrap gap-2">
                {sections.map((s, i) => (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      BADGE_COLORS[i % BADGE_COLORS.length]
                    }`}
                  >
                    {s}
                    <button
                      onClick={() => removeSection(s)}
                      className="hover:text-red-600 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <div
                  className={`mt-2 text-sm text-muted-foreground transition-opacity duration-500 ${
                    fading ? "opacity-0" : "opacity-100"
                  } motion-reduce:transition-none motion-reduce:duration-0`}
                  aria-live="polite"
                >
                  {feedback ?? ""}
                </div>
              </div>
            </div>
          </>
        </div>
      </Card>
    </>
  );
}

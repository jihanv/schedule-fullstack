"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { BADGE_COLORS } from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLanguage } from "@/stores/languageStore";

export default function SectionNameInput() {
    const { sections, addSections, removeSection, setActivateNext } =
        useTimePeriodStore();
    const { uiLanguage } = useLanguage()
    const [newSection, setNewSection] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [fading, setFading] = useState(false);


    useEffect(() => {
        setActivateNext(sections.length !== 0)

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
    }, [feedback, sections]);

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
            msg = `Added ${added.length} section${added.length > 1 ? "s" : ""}: ${added.join(", ")}`;
        } else if (added.length && skipped.length) {
            msg = `Added ${added.length}: ${added.join(", ")} · Skipped ${skipped.length} (duplicates or limit): ${skipped.join(", ")}`;
        } else if (!added.length && skipped.length) {
            msg = `No new sections added. Skipped ${skipped.length} (duplicates or limit): ${skipped.join(", ")}`;
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
            <div className="flex flex-col p-4 gap-4">
                {" "}
                <>
                    <h1>
                        {uiLanguage === "japanese"
                            ? `担当しているクラスをすべて書いてください`
                            : `Write Your Classes`}
                    </h1>
                    <form onSubmit={handleSubmit} className="space-y-5 ">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                type="text"
                                className="w-full"
                                value={newSection}
                                onChange={(e) => setNewSection(e.target.value)}
                                placeholder={
                                    uiLanguage === "japanese"
                                        ? `例： 数学IIB５ー３組`
                                        : `e.g. English 6-1`
                                }
                            />
                            <Button
                                className="mt-auto"
                                type="submit"
                                disabled={!newSection.trim()}
                                onClick={handleAdd}
                            >
                                {uiLanguage === "japanese" ? `組を追加` : `Add Sections`}
                            </Button>
                        </div>

                        <p className="text-lg text-muted-foreground whitespace-pre-line">
                            {uiLanguage === "japanese"
                                ? `1つずつ、または複数をカンマで区切って入力してください。
                                例：
                                ・1つずつ入力する場合：「数学IIB５ー３組」
                                ・複数入力する場合：「英表II５ー３組、英表II５ー４組」

                                ※「組を追加」ボタンを押したあとでも、必要に応じてクラスを追加・修正できます。
                                ※ クラスを削除するには、追加したクラス名の右側にある「×」をクリックしてください。`
                                : `Please enter them one at a time, or enter multiple items separated by commas.
                    Examples:
                    ・If entering one at a time: “Mathematics IIB 5-3 Class”
                    ・If entering multiple: “English Expression II 5-3 Class, English Expression II 5-4 Class”

                    ※ Even after you click the “Add class” button, you can add or edit classes as needed.
                    ※ To delete a class, click the “×” on the right side of the class tag (e.g., 英表II 5−3組) shown below the input field.`}
                        </p>
                    </form>
                    {/* Badges area */}
                    <div className="mt-2 min-h-10 max-h-30 overflow-auto">
                        <div className="flex flex-wrap gap-2">
                            {sections.map((s, i) => (
                                <span
                                    key={s}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${BADGE_COLORS[i % BADGE_COLORS.length]
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
                                className={`mt-2 text-sm text-muted-foreground transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"
                                    } motion-reduce:transition-none motion-reduce:duration-0`}
                                aria-live="polite"
                            >
                                {feedback ?? ""}
                            </div>
                        </div>
                    </div>
                </>
            </div>
        </>
    );
}

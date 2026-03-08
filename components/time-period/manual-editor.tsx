"use client";

import { useEffect } from "react";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import ManualWeeklyEditor from "@/components/time-period/manual-weekly-editor";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function ManualEditor() {
    const {
        setActivateNext,
        startDate,
        endDate,
        manualEditorIntroSeen,
        setManualEditorIntroSeen,
    } = useTimePeriodStore();
    const t = useTranslations("ManualEditorInstructions")
    useEffect(() => {
        // If intro not seen, block Next until user clicks OK
        setActivateNext(Boolean(manualEditorIntroSeen));
    }, [setActivateNext, manualEditorIntroSeen]);

    const rangeKey = `${startDate?.toISOString() ?? "no-start"}|${endDate?.toISOString() ?? "no-end"}`;

    return (
        <div className="relative">
            <ManualWeeklyEditor key={rangeKey} />

            {!manualEditorIntroSeen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/60" />

                    {/* card */}
                    <div className="relative w-full rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-semibold">{t("instructions")}</h2>
                        <ol>
                            <li>
                                {t("1")}
                            </li>
                            <li>
                                {t("2")}
                            </li>
                            <li>
                                {t("3")}
                            </li>
                            <li>
                                {t("4")}
                            </li>
                        </ol>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={() => {
                                    setManualEditorIntroSeen(true);
                                    setActivateNext(true);
                                }}
                            >
                                {t("ok")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
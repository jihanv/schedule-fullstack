"use client";

import ExportExcelButton from "@/components/time-period/excel-ex-btn";
import WeeklyTables from "@/components/time-period/weekly-tables";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/format/dialogue";
import { Button } from "@/components/ui/button";
import MeetingList from "./meeting-list";
import H1 from "@/components/format/h1";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLocale, useTranslations } from "next-intl";
import ExportExcelButtonJa from "@/components/time-period/excel-jp-btn"
import { saveFullSchedule } from "@/app/actions/save-full-schedule";

export default function InformationDisplay() {
    const showWeeklyPreview = useTimePeriodStore((s) => s.showWeeklyPreview);
    const setShowWeeklyPreview = useTimePeriodStore((s) => s.setShowWeeklyPreview);
    const { commitPendingHolidays } = useTimePeriodStore();

    const t = useTranslations("CompleteSchedule")
    const locale = useLocale();
    const uiLocale = locale === 'ja' ? 'ja' : 'en';

    // Convert Date -> YYYY-MM-DD using local date parts
    const toYmd = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Convert Zustand schedule shape into server payload shape:
    // - period keys become strings
    // - empty slots become null (not undefined)
    const normalizeScheduleForSave = (schedule: Record<string, Record<number, string | undefined>>) => {
        const normalized: Record<string, Record<string, string | null>> = {};

        for (const [dayKey, periods] of Object.entries(schedule)) {
            normalized[dayKey] = {};

            for (const [periodKey, sectionName] of Object.entries(periods)) {
                normalized[dayKey][String(periodKey)] = sectionName ?? null;
            }
        }

        return normalized;
    };
    const handleSaveClick = async () => {
        try {
            // 1) Make sure pending holiday edits are applied
            commitPendingHolidays();

            // 2) Read the freshest Zustand state after commit
            const snapshot = useTimePeriodStore.getState();

            if (!snapshot.startDate || !snapshot.endDate) {
                console.error("Cannot save: missing start/end date");
                return;
            }

            // 3) Build the payload
            const payload = {
                startDate: toYmd(snapshot.startDate),
                endDate: toYmd(snapshot.endDate),
                holidays: snapshot.holidays.map(toYmd),
                sections: snapshot.sections,
                schedule: normalizeScheduleForSave(snapshot.schedule),
                deletedLessons: snapshot.deletedLessons,
            };

            console.log("SAVE PAYLOAD (client):", payload);

            // 4) Send to server action (validation only for now)
            const result = await saveFullSchedule(payload);

            // 5) Inspect server response
            console.log("SAVE RESPONSE (server):", result);
        } catch (error) {
            console.error("Save failed:", error);
        }
    };
    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col sm:w-132.5 items-center p-10 border mt-10">
                <H1>{t("title")}</H1>
                <div className="flex flex-col gap-2 pt-5 sm:justify-center items-center">
                    <div className="flex flex-col">
                        <Button
                            className="w-55"
                            onClick={() => {
                                commitPendingHolidays(); // sync local → global
                                setShowWeeklyPreview(true); // open preview dialog
                            }}
                        >
                            {t("showSchedule")}
                        </Button>
                    </div>

                    <div className="flex flex-col">
                        <Button className="w-55" onClick={handleSaveClick}>
                            Save
                        </Button>
                    </div>
                    {/* Your dialog controlled by the store */}
                    <Dialog open={showWeeklyPreview} onOpenChange={setShowWeeklyPreview}>
                        <DialogContent className="h-[92vh] max-h-[92vh] flex flex-col">
                            <DialogHeader className="shrink-0">
                                <DialogTitle>{t("weeklyScheduleDialogTitle")}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[90vh] overflow-auto p-4">
                                {/* WeeklyTables reads `holidays` (now up to date) */}
                                <WeeklyTables />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div>
                        {uiLocale === "ja" ? (
                            <ExportExcelButtonJa />
                        ) : (
                            <ExportExcelButton />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center w-75.5 sm:w-132.5 border">
                <MeetingList />
            </div>
        </div>
    );
}

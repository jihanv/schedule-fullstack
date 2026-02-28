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
import { useTranslations } from "next-intl";
import { saveFullSchedule } from "@/app/actions/timeperiod";
import { useState } from "react";
import ExportAttendanceButton from "@/components/time-period/attendance-ex-btn";

export default function InformationDisplay() {
    const showWeeklyPreview = useTimePeriodStore((s) => s.showWeeklyPreview);
    const setShowWeeklyPreview = useTimePeriodStore((s) => s.setShowWeeklyPreview);
    const { commitPendingHolidays } = useTimePeriodStore();
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const t = useTranslations("CompleteSchedule")
    // const locale = useLocale();
    // const uiLocale = locale === 'ja' ? 'ja' : 'en';

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
        setIsSaving(true);
        await new Promise((r) => setTimeout(r, 1500));
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
                manualLessons: snapshot.manualLessons,
            };

            console.log("SAVE PAYLOAD (client):", payload);

            // 4) Send to server action (validation only for now)
            const result = await saveFullSchedule(payload);
            if (result.ok) {
                setShowSuccess(true);
            }
            // 5) Inspect server response
            console.log("SAVE RESPONSE (server):", result);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);

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
                    <Dialog open={isSaving} onOpenChange={() => { }}>
                        <DialogContent
                            className="w-[92vw] max-w-md p-8 text-center"
                            onInteractOutside={(e) => e.preventDefault()}
                            onEscapeKeyDown={(e) => e.preventDefault()}
                        >                      <DialogHeader>
                                <DialogTitle>Saving…</DialogTitle>
                            </DialogHeader>
                            <div className="mt-6 flex justify-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
                            </div>
                            <p className="text-sm mt-3">
                                Please don’t close this tab/window while we save your schedule.
                            </p>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                        <DialogContent
                            className="w-[92vw] max-w-md p-8 text-center"
                        >
                            <DialogHeader>
                                <DialogTitle>Saved!</DialogTitle>
                            </DialogHeader>

                            <p className="text-sm">Your schedule was saved successfully.</p>

                            <Button onClick={() => setShowSuccess(false)}>OK</Button>
                        </DialogContent>
                    </Dialog>
                    <div className="flex flex-col gap-2">
                        <ExportExcelButton />
                        <ExportAttendanceButton />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center w-75.5 sm:w-132.5 border">
                <MeetingList />
            </div>
        </div>
    );
}

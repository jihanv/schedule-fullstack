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
// import WeeklyTablesJa from "./weekly-tables-jp";

export default function InformationDisplay() {
    const showWeeklyPreview = useTimePeriodStore((s) => s.showWeeklyPreview);
    const setShowWeeklyPreview = useTimePeriodStore((s) => s.setShowWeeklyPreview);
    const { commitPendingHolidays } = useTimePeriodStore();

    const t = useTranslations("CompleteSchedule")
    const locale = useLocale();
    const uiLocale = locale === 'ja' ? 'ja' : 'en';
    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col sm:w-132.5 items-center p-10 border mt-10">
                <H1>{t("title")}</H1>
                <div className="flex flex-col sm:flex-row  gap-2 pt-5 sm:justify-center items-center">
                    <div className="flex flex-col">
                        <Button
                            className="w-55"
                            onClick={() => {
                                commitPendingHolidays(); //  sync local → global
                                setShowWeeklyPreview(true); // open preview dialog
                            }}
                        >
                            {t("showSchedule")}
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

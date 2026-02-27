"use client";

import { useEffect } from "react";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import ManualWeeklyEditor from "@/components/time-period/manual-weekly-editor";

export default function ManualEditor() {
    const { setActivateNext, startDate, endDate } = useTimePeriodStore();

    useEffect(() => {
        setActivateNext(true);
    }, [setActivateNext]);

    const rangeKey = `${startDate?.toISOString() ?? "no-start"}|${endDate?.toISOString() ?? "no-end"}`;

    return <ManualWeeklyEditor key={rangeKey} />;
}
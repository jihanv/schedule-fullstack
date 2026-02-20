// app/components/periods/period-grid.tsx
"use client";

import { PERIODS, WEEKDAY_LABELS } from "@/lib/constants";
import { WeekdayKey } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import SectionPopover from "./section-popover";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLocale } from "next-intl";

type CellCoord = { day: WeekdayKey; period: number };

export default function PeriodGrid() {
    const schedule = useTimePeriodStore((s) => s.schedule);

    const setActivateNext = useTimePeriodStore((s) => s.setActivateNext);

    const locale = useLocale();
    const uiLocale = locale === 'ja' ? 'ja' : 'en'; // fallback to 'en'
    const [openCell, setOpenCell] = useState<CellCoord | null>(null);

    // 👇 labels for the header, display-only
    const displayWeekdays = getDisplayWeekdays(uiLocale);

    const hasAny = useMemo(
        () => Object.values(schedule).some((day) => Object.keys(day ?? {}).length > 0),
        [schedule],
    );

    useEffect(() => {
        setActivateNext(hasAny); // false when empty, true otherwise
    }, [hasAny, setActivateNext]);

    return (
        <div className="rounded-2xl border bg-card">
            <table className="w-full mx-auto table-fixed border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr>
                        {displayWeekdays.map(({ key, label }) => (
                            <th
                                key={key}
                                className="px-3 py-3 text-center text-sm font-medium whitespace-nowrap"
                            >
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {PERIODS.map((p) => (
                        <tr key={p} className="border-t">
                            {displayWeekdays.map(({ key }) => {
                                const day = key as WeekdayKey;
                                const assignedSection = schedule[day]?.[p];

                                return (
                                    <td key={`${key}-${p}`} className="p-2 align-top h-full">
                                        <div className="h-full">
                                            <SectionPopover
                                                day={day}
                                                period={p}
                                                assigned={assignedSection}
                                                open={openCell?.day === day && openCell?.period === p}
                                                onOpenChange={(o) => setOpenCell(o ? { day, period: p } : null)}
                                            />
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export function getDisplayWeekdays(
    uiLocale: "en" | "ja",
    startOnSunday = false,
) {
    const order = startOnSunday
        ? (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)
        : (["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const);
    return order.map((k) => ({
        key: k as WeekdayKey,
        label:
            WEEKDAY_LABELS[uiLocale][k as keyof (typeof WEEKDAY_LABELS)["en"]],
    }));
}
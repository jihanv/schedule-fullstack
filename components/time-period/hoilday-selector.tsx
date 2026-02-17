"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui//button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    format,
    isAfter,
    isBefore,
    startOfDay,
    min as minDate,
    max as maxDate,
} from "date-fns";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useLanguage } from "@/stores/languageStore";

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthsBetweenInclusive(a: Date, b: Date) {
    const y = b.getFullYear() - a.getFullYear();
    const m = b.getMonth() - a.getMonth();
    return y * 12 + m + 1; // inclusive count
}

export default function HolidaySelector() {

    const { startDate, endDate, setActivateNext, holidays,
        setHolidays,
        showHolidaySelector,
        pendingHolidays,
        setPendingHolidays,
        noHolidays,
        setNoHolidays, } = useTimePeriodStore();
    const { uiLanguage } = useLanguage();

    const [country, setCountry] = React.useState<"US" | "JP" | "CA">("JP");
    const [loadingHolidays, setLoadingHolidays] = React.useState(false);

    function ymdToLocalDate(ymd: string) {
        // Convert "YYYY-MM-DD" to a Date at local midnight (avoids TZ drift)
        const [y, m, d] = ymd.split("-").map(Number);
        return startOfDay(new Date(y, (m ?? 1) - 1, d ?? 1));
    }

    React.useEffect(() => {
        if (noHolidays) {
            setActivateNext(true);
        }
        if (showHolidaySelector) setPendingHolidays(holidays ?? []);
    }, [showHolidaySelector, holidays, setPendingHolidays, noHolidays]);

    async function addNationalHolidays() {
        if (!startDate || !endDate) return;
        setLoadingHolidays(true);
        try {
            const sd = startOfDay(minDate([startDate, endDate]));
            const ed = startOfDay(maxDate([startDate, endDate]));

            // All years spanned by the range (inclusive)
            const years = new Set<number>();
            for (let y = sd.getFullYear(); y <= ed.getFullYear(); y++) years.add(y);

            // fetch each year via our API route
            const results = await Promise.all(
                Array.from(years).map(async (year) => {
                    const res = await fetch(
                        `/api/holidays?country=${country}&year=${year}`,
                    );
                    if (!res.ok) return [];
                    const data: {
                        holidays: { date: string; name: string; country: string }[];
                    } = await res.json();
                    return data.holidays ?? [];
                }),
            );

            // Flatten, convert to Date, and clamp to [sd..ed]
            const fetchedDates = results
                .flat()
                .map((h) => ymdToLocalDate(h.date))
                .filter((d) => !isBefore(d, sd) && !isAfter(d, ed));

            // Merge with existing holidays; your store will unique + sort on setHolidays
            const merged = [...pendingHolidays, ...fetchedDates];
            setHolidays(merged);
        } catch (e) {
            console.error("Failed adding national holidays", e);
        } finally {
            setLoadingHolidays(false);
        }
        setActivateNext(true);
        setNoHolidays(true);
    }
    return (
        <>
            <Card className="flex flex-col max-h-[80vh] overflow-hidden">
                <CardHeader>
                    <CardTitle>
                        {uiLanguage === "japanese" ? `祝日` : `Holidays`}
                    </CardTitle>
                    <CardDescription>
                        {uiLanguage === "japanese"
                            ? `国を選択し「祝日を自動追加」をクリックすると、期間内の国民の祝日を自動で追加できます。追加後、学校行事による休講日（例：文化祭・体育祭・入試 など）もカレンダー上で選択してください。`
                            : `Select a country and click “Automatically add public holidays” to automatically add the national public holidays within the selected period. After adding them, please also select any school event closure days (e.g., school festival, sports day, entrance exams, etc.) on the calendar.`}
                    </CardDescription>
                </CardHeader>
                {/* <div className="flex flex-col items-center"> */}
                <CardContent className="min-h-0 flex-1 overflow-y-auto">
                    {/* Country selector + Add button */}
                    <div className="flex flex-col items-center">
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <label
                                htmlFor="country"
                                className="text-sm text-muted-foreground"
                            >
                                {uiLanguage === "japanese" ? `国` : `Country`}
                            </label>
                            <select
                                id="country"
                                className="h-9 rounded-md border bg-background px-2 text-sm"
                                value={country}
                                onChange={(e) =>
                                    setCountry(e.target.value as "US" | "JP" | "CA")
                                }
                            >
                                <option value="US">
                                    {uiLanguage === "japanese"
                                        ? "アメリカ"
                                        : "United States of America"}
                                </option>
                                <option value="JP">
                                    {uiLanguage === "japanese" ? "日本" : "Japan"}
                                </option>
                                <option value="CA">
                                    {uiLanguage === "japanese" ? "カナダ" : "Canada"}
                                </option>
                            </select>

                            <Button onClick={addNationalHolidays} disabled={loadingHolidays}>
                                {loadingHolidays
                                    ? uiLanguage === "japanese"
                                        ? "追加中…"
                                        : "Adding…"
                                    : uiLanguage === "japanese"
                                        ? "祝日を自動追加"
                                        : "Add national holidays"}
                            </Button>
                        </div>

                        {/* We can only get to this step if there are dates */}
                        <div className="flex overflow-x-auto">
                            <Calendar
                                hideNavigation
                                uiLanguage={uiLanguage}
                                mode="multiple"
                                month={startOfMonth(startDate!)}
                                numberOfMonths={monthsBetweenInclusive(
                                    startOfMonth(startDate!),
                                    startOfMonth(endDate!),
                                )}
                                selected={pendingHolidays}
                                onSelect={(d) => setPendingHolidays(d ?? [])}
                                disabled={(d) => {
                                    const sd = startOfDay(minDate([startDate!, endDate!]));
                                    const ed = startOfDay(maxDate([startDate!, endDate!]));
                                    const day = startOfDay(d);
                                    return isBefore(day, sd) || isAfter(day, ed);
                                }}
                                showOutsideDays={false}
                                classNames={{
                                    // the container that holds all month calendars
                                    months:
                                        "flex flex-wrap sm:flex-row justify-center gap-y-8 gap-x-8",

                                    // each month: full width on small screens, half (minus the gap) on md+
                                    month: `flex flex-col max-md:basis-full md:basis-[calc(50%-1rem)] md:shrink-0 md:grow-0 gap-4 border border-border rounded-lg p-4 shadow-sm bg-background`,
                                }}
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPendingHolidays([]);
                                    setHolidays([]);
                                }}
                            >
                                {uiLanguage === "japanese" ? `すべてクリア` : `Clear all`}
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => {
                                    setActivateNext(true);
                                    setNoHolidays(true);
                                }}
                            >
                                {uiLanguage === "japanese"
                                    ? `追加する休日はありません`
                                    : `No holidays to add`}
                            </Button>
                        </div>

                        {pendingHolidays.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {pendingHolidays.map((h) => (
                                    <Badge
                                        key={h.toISOString()}
                                        variant="secondary"
                                        className="gap-2"
                                    >
                                        {format(h, "MMM d (EEE)")}
                                        <button
                                            className="-mr-1 rounded px-1 text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                setPendingHolidays(
                                                    pendingHolidays.filter(
                                                        (x) => x.toDateString() !== h.toDateString(),
                                                    ),
                                                )
                                            }
                                            aria-label="Remove holiday"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

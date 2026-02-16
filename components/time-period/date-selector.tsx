"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DateButton from '@/components/time-period/date-button'
import {
    addDays,
    startOfDay,
} from "date-fns";
import { useTimePeriodStore } from '@/stores/timePeriodStore';
import { useLanguage } from '@/stores/languageStore';
import { Button } from '../ui/button';
import { useActionState, useEffect } from "react";
import { format } from "date-fns";
import { saveTimePeriod } from "@/app/actions/save-time-periods";

export default function DateSelector() {
    const { startDate, setStartDate, endDate, setEndDate, setActivateNext } = useTimePeriodStore();
    const { uiLanguage } = useLanguage();
    const maxEnd = startDate ? startOfDay(addDays(startDate, 183)) : undefined;
    const [state, formAction, isPending] = useActionState(saveTimePeriod, { ok: false, error: "" });

    useEffect(() => {
        if (state.ok) {
            setActivateNext(true);
        }
    }, [state.ok, setActivateNext]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{uiLanguage === "japanese" ? `日付範囲` : `Date range`}</CardTitle>
                    <CardDescription>{uiLanguage === "japanese" ? `開始日と終了日を選択してください。`
                        : `Choose the start and end dates for your class run.`}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DateButton label={uiLanguage === "japanese" ? `開始日` : `Start date`} date={startDate} setDateAction={setStartDate} max={endDate} />
                    <DateButton label={uiLanguage === "japanese" ? `終了日` : `End date`} date={endDate} setDateAction={setEndDate} min={startDate} max={maxEnd} />
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                    </div>
                </CardContent>
                <form
                    className='flex'
                    action={formAction}
                    onSubmit={(e) => {
                        // client-side guard so we don’t submit empty dates
                        if (!startDate || !endDate) {
                            e.preventDefault();
                        }
                    }}
                >
                    <input
                        type="hidden"
                        name="startDate"
                        value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    />
                    <input
                        type="hidden"
                        name="endDate"
                        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    />

                    <Button
                        type="submit"
                        disabled={!startDate || !endDate || isPending}
                        className="w-30 m-auto"
                    >
                        {isPending ? "Saving..." : "Save"}
                    </Button>

                    {/* Show server-side validation/auth/db errors */}
                    {state.ok === false && state.error && (
                        <p className="mt-2 text-sm text-red-600">{state.error}</p>
                    )}

                    {/* Optional: show field-specific validation errors */}
                    {state.ok === false && state.fieldErrors?.startDate?.length ? (
                        <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startDate[0]}</p>
                    ) : null}
                    {state.ok === false && state.fieldErrors?.endDate?.length ? (
                        <p className="mt-1 text-sm text-red-600">{state.fieldErrors.endDate[0]}</p>
                    ) : null}
                </form>
            </Card>

        </>


    )
}

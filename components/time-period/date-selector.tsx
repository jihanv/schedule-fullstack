"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DateButton from '@/components/time-period/date-button'
import {
    addDays,
    startOfDay,
} from "date-fns";
import { useEffect } from 'react';
import { useTimePeriodStore } from '@/stores/timePeriodStore';
import { useLanguage } from '@/stores/languageStore';

export default function DateSelector() {
    const { startDate, setStartDate, endDate, setEndDate, setActivateNext } = useTimePeriodStore();
    const { uiLanguage } = useLanguage();

    const maxEnd = startDate ? startOfDay(addDays(startDate, 183)) : undefined;

    // if (startDate && endDate) {
    //     setActivateNext(true)
    // }
    useEffect(() => {
        if (startDate && endDate) {
            setActivateNext(true)
        }
    }, [startDate, endDate])
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
            </Card>
        </>

    )
}

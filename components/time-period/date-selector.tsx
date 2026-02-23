"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DateButton from "@/components/time-period/date-button";
import { addDays, startOfDay } from "date-fns";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

export default function DateSelector() {
  const { startDate, setStartDate, endDate, setEndDate, setActivateNext } =
    useTimePeriodStore();
  const maxEnd = startDate ? startOfDay(addDays(startDate, 183)) : undefined;

  const d = useTranslations("DateSelector");

  const handleSave = () => {
    if (!startDate || !endDate) return;
    console.log(startDate, endDate);
    setActivateNext(true);
  };
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{d("title")}</CardTitle>
          <CardDescription>{d("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateButton
            label={d("startDateLabel")}
            date={startDate}
            setDateAction={setStartDate}
            max={endDate}
          />
          <DateButton
            label={d("endDateLabel")}
            date={endDate}
            setDateAction={setEndDate}
            min={startDate}
            max={maxEnd}
          />
          <div className="col-span-1 md:col-span-2 flex items-center gap-2"></div>
        </CardContent>
        <div className="flex">

          <Button
            type="button"
            disabled={!startDate || !endDate}
            onClick={handleSave}
            className="w-30 m-auto"
          >
            {d("set")}
          </Button>
        </div>
      </Card>
    </>
  );
}

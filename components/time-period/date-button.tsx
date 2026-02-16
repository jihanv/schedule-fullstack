
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    format,
    isAfter,
    isBefore,
    startOfDay,
} from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/stores/languageStore";

export type DateButtonProps = {
    label: string;
    date?: Date;
    setDateAction: (d?: Date) => void;
    min?: Date;
    max?: Date;
};


export default function DateButton({
    label,
    date,
    setDateAction,
    min,
    max,
}: DateButtonProps) {
    const [open, setOpen] = React.useState(false);
    const { uiLanguage } = useLanguage()

    return (
        <div className="flex flex-col gap-2">
            <Label className="px-1">{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-64 justify-between font-normal">
                        <span className="inline-flex items-center gap-2">
                            <CalendarIcon className="size-4" />
                            {date
                                ? format(
                                    date,
                                    "yyyy-MM-dd (EEE)", // Same format works in both languages
                                    { locale: uiLanguage === "japanese" ? ja : enUS }
                                )
                                : uiLanguage === "japanese"
                                    ? "日付を選択"
                                    : "Select date"}
                        </span>
                        <span className="text-muted-foreground">▾</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        uiLanguage={uiLanguage}
                        mode="single"
                        locale={uiLanguage === "japanese" ? ja : enUS}
                        selected={date}
                        onSelect={(d) => {
                            setDateAction(d);
                            setOpen(false);
                        }}
                        disabled={(d) => {
                            const sd = startOfDay(d);
                            if (min && isBefore(sd, startOfDay(min))) return true;
                            if (max && isAfter(sd, startOfDay(max))) return true;
                            return false;
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
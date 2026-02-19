import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { enUS, ja } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

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
  const t = useTranslations("DateSelector");
  const locale = useLocale();
  const dateFnsLocale = locale === "ja" ? ja : enUS;

  return (
    <div className="flex flex-col gap-2">
      <Label className="px-1">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-50 justify-between font-normal"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarIcon className="size-4" />
              {date
                ? format(date, "yyyy-MM-dd (EEE)", { locale: dateFnsLocale })
                : t("selectDate")}
            </span>
            <span className="text-muted-foreground">▾</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={dateFnsLocale}
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

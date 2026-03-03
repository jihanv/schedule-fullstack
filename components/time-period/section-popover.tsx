"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { BADGE_COLORS } from "@/lib/constants";
import { WeekdayKey } from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations } from "next-intl";

type SectionPopoverProps = {
    day: WeekdayKey;
    period: number;
    assigned?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function SectionPopover({
    day,
    period,
    assigned,
    open,
    onOpenChange,
}: SectionPopoverProps) {

    const t = useTranslations("SectionPopover")
    const { sections, setSectionForPeriod, clearPeriod } = useTimePeriodStore();

    const badgeColorFor = (section?: string) => {
        if (!section) return "bg-secondary text-secondary-foreground";
        const i = sections.indexOf(section);
        return i >= 0
            ? BADGE_COLORS[i % BADGE_COLORS.length]
            : "bg-secondary text-secondary-foreground";
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    asChild
                    className={`w-full h-full min-h-14 rounded-md border px-2 text-sm
              flex flex-col items-center justify-center gap-0.5
              ${assigned ? badgeColorFor(assigned) : "bg-neutral-200 hover:bg-accent text-muted-foreground"}`}
                    aria-label={`Select ${day} period ${period}`}
                >
                    <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 px-2">
                        <span className="font-medium leading-none">{period}</span>
                        <span className={`text-xs text-center wrap-break-word whitespace-normal leading-tight transition-opacity ${assigned ? "opacity-100" : "opacity-0"}`}>
                            {assigned || ""}
                        </span>
                    </div>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-30" align="start">
                <Command>
                    <CommandList>
                        <CommandEmpty>{t("empty")}</CommandEmpty>

                        <CommandGroup heading={t("sectionsHeading")}>
                            {sections.map((s) => (
                                <CommandItem
                                    key={s}
                                    value={s}
                                    className="justify-center"
                                    onSelect={() => {
                                        setSectionForPeriod(day, period, s);
                                        onOpenChange(false);
                                    }}
                                >
                                    {s}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandGroup>
                            <CommandItem
                                value="__clear"
                                className="justify-center font-bold"
                                onSelect={() => {
                                    clearPeriod(day, period);
                                    onOpenChange(false);
                                }}
                            >
                                {t("clear")}
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

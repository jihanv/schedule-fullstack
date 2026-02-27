"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
// import { Button } from "@/components/ui/button";
import { BADGE_COLORS } from "@/lib/constants";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { useTranslations } from "next-intl";

type ManualSectionPopoverProps = {
    dateKey: string;
    period: number;
    assigned?: string;
    subLabel?: string; // <-- ADD THIS
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ManualSectionPopover({
    dateKey,
    period,
    assigned,
    open,
    subLabel,
    onOpenChange,
}: ManualSectionPopoverProps) {
    // Reuse the same translations as SectionPopover so you don't have to add new i18n keys yet
    const t = useTranslations("SectionPopover");

    const { sections, upsertManualLesson, removeManualLesson } = useTimePeriodStore();

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
                <button
                    type="button"
                    className={`rounded-md p-2 h-17 w-full flex flex-col items-start text-left ${assigned
                        ? badgeColorFor(assigned)
                        : "bg-muted/70 hover:bg-muted/20 text-muted-foreground"
                        }`}
                >
                    <div className="flex items-start justify-between gap-1">
                        <div className="font-medium leading-4">{period}</div>
                        <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-50">
                            ▾
                        </div>
                    </div>

                    <div
                        className={`text-xs leading-4 ${assigned ? "font-semibold" : "text-muted-foreground"
                            }`}
                    >
                        {assigned ?? "—"}
                    </div>

                    <div className="text-xs leading-4 min-h-4 text-muted-foreground">
                        {subLabel ?? ""}
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-56" align="start">
                <Command>
                    <CommandList>
                        <CommandEmpty>{t("empty")}</CommandEmpty>

                        <CommandGroup heading={t("sectionsHeading")}>
                            {sections.map((s) => (
                                <CommandItem
                                    key={s}
                                    value={s}
                                    onSelect={() => {
                                        upsertManualLesson(dateKey, period, s);
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
                                onSelect={() => {
                                    removeManualLesson(dateKey, period);
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
"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { BADGE_COLORS } from "@/lib/constants";

type SavedManualCellPopoverProps = {
    period: number;
    sections: string[];
    assigned?: string;
    subLabel?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectSection: (section: string) => void;
    onClear: () => void;
};

function badgeColorFor(section: string | undefined, sections: string[]) {
    if (!section) return "bg-muted/70 hover:bg-muted/20 text-muted-foreground";

    const index = sections.indexOf(section);

    if (index === -1) {
        return "bg-secondary text-secondary-foreground";
    }

    return BADGE_COLORS[index % BADGE_COLORS.length]!;
}

export default function SavedManualCellPopover({
    period,
    sections,
    assigned,
    subLabel,
    open,
    onOpenChange,
    onSelectSection,
    onClear,
}: SavedManualCellPopoverProps) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={`rounded-md p-2 h-17 w-full flex flex-col items-start text-left ${badgeColorFor(
                        assigned,
                        sections,
                    )}`}
                >
                    <div className="flex items-start justify-between gap-1 w-full">
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
                        <CommandEmpty>No sections found.</CommandEmpty>

                        <CommandGroup heading="Sections">
                            {sections.map((section) => (
                                <CommandItem
                                    key={section}
                                    value={section}
                                    onSelect={() => {
                                        onSelectSection(section);
                                        onOpenChange(false);
                                    }}
                                >
                                    {section}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandGroup>
                            <CommandItem
                                value="__clear"
                                onSelect={() => {
                                    onClear();
                                    onOpenChange(false);
                                }}
                            >
                                Clear
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
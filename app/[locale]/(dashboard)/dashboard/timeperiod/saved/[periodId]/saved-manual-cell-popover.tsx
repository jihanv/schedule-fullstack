"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

type SavedManualCellPopoverProps = {
    period: number;
    sections: string[];
    assigned?: string;
    subLabel?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectSection: (section: string) => void;
    onClear: () => void;
    className?: string;
};

export default function SavedManualCellPopover({
    period,
    sections,
    assigned,
    subLabel,
    open,
    onOpenChange,
    onSelectSection,
    onClear,
    className,
}: SavedManualCellPopoverProps) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={
                        className ??
                        "h-24 w-full rounded-md p-2 flex flex-col justify-between items-start text-left overflow-hidden"
                    }
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
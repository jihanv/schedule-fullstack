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
    sections: string[];
    assigned?: string;
    lessonNumber?: number;
    subLabel?: string;
    subLabelClassName?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectSection: (section: string) => void;
    onClear: () => void;
    disabled?: boolean;
    className?: string;
};

export default function SavedManualCellPopover({
    sections,
    assigned,
    lessonNumber,
    subLabel,
    subLabelClassName,
    open,
    onOpenChange,
    onSelectSection,
    onClear,
    disabled,
    className,
}: SavedManualCellPopoverProps) {
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={
                        className ??
                        "h-24 w-full rounded-md p-2 flex flex-col justify-between items-start text-left overflow-hidden"
                    }
                >
                    <div className="flex items-start justify-between gap-2 w-full">
                        <div
                            className={`text-sm leading-4 truncate ${assigned ? "font-semibold" : "text-muted-foreground"
                                }`}
                        >
                            {assigned ?? "—"}
                        </div>

                        <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-50">
                            ▾
                        </div>
                    </div>

                    <div className="text-xs leading-4 min-h-4 text-muted-foreground">
                        {typeof lessonNumber === "number" ? `Lesson ${lessonNumber}` : ""}
                    </div>

                    <div className={`text-xs leading-4 min-h-4 ${subLabelClassName ?? "text-muted-foreground"}`}>
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
                                        if (disabled) return;
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
                                    if (disabled) return;
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
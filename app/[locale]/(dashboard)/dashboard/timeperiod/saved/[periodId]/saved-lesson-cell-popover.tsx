"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

type SavedLessonCellPopoverProps = {
    assigned: string;
    lessonNumber: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete: () => void;
    disabled?: boolean;
    className?: string;
};

export default function SavedLessonCellPopover({
    assigned,
    lessonNumber,
    open,
    onOpenChange,
    onDelete,
    disabled,
    className,
}: SavedLessonCellPopoverProps) {
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
                        <div className="text-sm font-semibold truncate">{assigned}</div>
                        <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-50">
                            ▾
                        </div>
                    </div>

                    <div className="text-xs leading-4 min-h-4 text-muted-foreground">
                        Lesson {lessonNumber}
                    </div>

                    <div className="min-h-4" />
                </button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-48" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                value="__delete"
                                onSelect={() => {
                                    if (disabled) return;
                                    onDelete();
                                    onOpenChange(false);
                                }}
                            >
                                {disabled ? "Saving..." : "Delete lesson"}
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
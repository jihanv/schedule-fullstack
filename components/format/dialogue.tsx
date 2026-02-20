"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

export function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger(
    props: React.ComponentProps<typeof DialogPrimitive.Trigger>
) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

export function DialogContent({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
            <DialogPrimitive.Content
                className={cn(
                    "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                    "w-[90vw] max-w-5xl max-h-[80vh] overflow-hidden",
                    "rounded-lg border bg-background shadow-2xl",
                    className
                )}
                {...props}
            />
        </DialogPrimitive.Portal>
    )
}

export function DialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex items-center justify-between border-b px-4 py-2", className)}
            {...props}
        />
    )
}

export function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            className={cn("text-sm font-medium", className)}
            {...props}
        />
    )
}

export function DialogClose(
    props: React.ComponentProps<typeof DialogPrimitive.Close>
) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

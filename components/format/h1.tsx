import { cn } from "@/lib/utils";

export type H1Props = {
    children: React.ReactNode;
    className?: string;
}


export default function H1({ children, className }: H1Props) {
    return (
        <h1 className={cn("font-medium text-lg sm:text-2xl leading-6", className)}>{children}</h1>
    )
}
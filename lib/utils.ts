import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BADGE_COLORS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function badgeColorFor(section: string | undefined, sections: string[]) {
  if (!section) return "bg-secondary text-secondary-foreground";
  const i = sections.indexOf(section);
  return i >= 0
    ? BADGE_COLORS[i % BADGE_COLORS.length]
    : "bg-secondary text-secondary-foreground";
}

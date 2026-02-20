import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { BADGE_COLORS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpointPx]);

  return isMobile;
}

export function badgeColorFor(section: string | undefined, sections: string[]) {
  if (!section) return "bg-secondary text-secondary-foreground";
  const i = sections.indexOf(section);
  return i >= 0
    ? BADGE_COLORS[i % BADGE_COLORS.length]
    : "bg-secondary text-secondary-foreground";
}

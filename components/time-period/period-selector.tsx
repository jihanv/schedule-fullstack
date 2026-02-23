"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PeriodGrid from "./period-grid";
import PeriodGridMobile from "./period-mobile-grid";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function PeriodSelector() {
    const isMobile = useIsMobile(768);
    const t = useTranslations("PeriodSelector")
    return (
        <>
            <div className="flex flex-col w-flll items-center">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t("title")}
                        </CardTitle>
                        <CardDescription>
                            {t("description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isMobile ? (
                            <PeriodGridMobile />
                        ) : (
                            <ScrollArea className="rounded-md">
                                <PeriodGrid />
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function useIsMobile(breakpointPx = 768) {
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

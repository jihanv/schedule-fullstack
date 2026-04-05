"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { getEditableScheduleForPeriod } from "@/app/actions/timeperiod";
import { useNavigationStore } from "@/stores/navigationStore";
import { useTimePeriodStore } from "@/stores/timePeriodStore";
import { Button } from "@/components/ui/button";

export default function LoadSavedScheduleTest() {
    const { isSignedIn } = useAuth();
    const [periodId, setPeriodId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadSavedSchedule = useTimePeriodStore((s) => s.loadSavedSchedule);
    const setSteps = useNavigationStore((s) => s.setSteps);

    if (!isSignedIn) return null;

    const handleLoad = () => {
        const trimmed = periodId.trim();
        if (!trimmed) {
            setError("Enter a saved period id first.");
            return;
        }

        setError(null);

        startTransition(async () => {
            const result = await getEditableScheduleForPeriod({
                periodId: trimmed,
            });

            if (!result.ok) {
                setError(result.error);
                return;
            }

            loadSavedSchedule(result.editableSchedule);
            setSteps(1);
        });
    };

    return (
        <div className="mb-4 rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Load saved schedule (test)</div>

            <div className="flex gap-2">
                <input
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    placeholder="Paste period_id"
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                />

                <Button type="button" onClick={handleLoad} disabled={isPending}>
                    {isPending ? "Loading..." : "Load"}
                </Button>
            </div>

            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
    );
}
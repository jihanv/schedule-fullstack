import { getTimePeriodsForCurrentUser } from "@/app/actions/timeperiod";
import { Link } from "@/i18n/navigation";

export default async function Page() {

    const savedPeriodsResult = await getTimePeriodsForCurrentUser({ limit: 50 })
    const savedPeriods = savedPeriodsResult.ok ? savedPeriodsResult.timePeriods : [];
    const savedPeriodCount = savedPeriods.length;

    // const { uiLanguage } = useLanguage();
    return (
        <>
            <main>
                <h1 className="text-2xl font-semibold">
                    Attendance
                </h1>
                <p>
                    Choose a saved schedule to manage attendance.
                </p>
                <p className="text-sm text-muted-foreground">Saved schedules found: {savedPeriodCount}</p>
                <ul>
                    {savedPeriods.map((period) => (
                        <li key={period.period_id}>
                            <Link href={`/dashboard/attendance/${period.period_id}`}>
                                {String(period.startDate)} → {String(period.endDate)}
                            </Link>
                        </li>
                    ))}
                </ul>

            </main>
        </>
    )
}
import { getTimePeriodById, getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";

type PageProps = {
    params: Promise<{ periodId: string }>;
};

export default async function Page({ params }: PageProps) {
    const { periodId } = await params;
    const savedPeriodResult = await getTimePeriodById({ periodId });

    if (!savedPeriodResult.ok) return <p>Saved period not found.</p>;
    const coursesResult = await getCoursesAndLessonsForPeriod({ periodId });
    const courseCount = coursesResult.ok ? coursesResult.courses.length : 0;
    return (
        <>
            <h1 className="text-2xl font-semibold">
                Attendance for {String(savedPeriodResult.timePeriod.startDate)} →{" "}
                {String(savedPeriodResult.timePeriod.endDate)}
            </h1>
            <p className="text-sm text-muted-foreground">Classes found: {courseCount}</p>
        </>

    );
}
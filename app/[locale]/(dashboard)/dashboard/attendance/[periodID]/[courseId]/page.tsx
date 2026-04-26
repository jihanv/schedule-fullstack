import { getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";


type PageProps = {
    params: Promise<{ periodId: string; courseId: string }>;
};

export default async function Page({ params }: PageProps) {

    const { periodId, courseId } = await params;
    const savedClassesResult = await getCoursesAndLessonsForPeriod({ periodId });
    const selectedClass = savedClassesResult.ok
        ? savedClassesResult.courses.find((course) => course.course_id === courseId)
        : null;

    if (!selectedClass) return <p>Class not found.</p>;
    const lessonCount = selectedClass.lessons.length;
    return (
        <>
            <h1 className="text-2xl font-semibold">
                Attendance for {selectedClass.courseName}
            </h1>
            <p className="text-sm text-muted-foreground">Lessons found: {lessonCount}</p>
        </>
    );
}
import { getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";
const MAX_STUDENTS = 5;
const TALLY_COLUMNS = ["停", "忌", "欠", "ホ", "停・忌", "欠時", "総授業時数", "基準時数"];

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
    const studentSlots = Array.from({ length: MAX_STUDENTS }, (_, index) => index + 1);
    return (
        <>
            <h1 className="text-2xl font-semibold">
                Attendance for {selectedClass.courseName}
            </h1>
            <p className="text-sm text-muted-foreground">
                Lessons found: {lessonCount}
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="border-collapse text-sm">
                    <tbody>
                        <tr>
                            <th className="sticky left-0 z-1 bg-background pr-4 text-left">Date</th>
                            {selectedClass.lessons.map((lesson) => (
                                <td key={lesson.lesson_id} className="border px-2">
                                    {String(lesson.lessonDate)}
                                </td>
                            ))}
                            {TALLY_COLUMNS.map((label) => (
                                <th key={label} rowSpan={3} className="border px-2">
                                    {label}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th className="sticky left-0 z-1 bg-background pr-4 text-left">Period</th>
                            {selectedClass.lessons.map((lesson) => (
                                <td key={lesson.lesson_id} className="border px-2">
                                    Period {lesson.timeSlot}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <th className="sticky left-0 z-1 bg-background pr-4 text-left">Lesson</th>
                            {selectedClass.lessons.map((lesson) => (
                                <td key={lesson.lesson_id} className="border px-2">
                                    {lesson.lessonNumber}
                                </td>
                            ))}
                        </tr>
                        {studentSlots.map((studentNumber) => (
                            <tr key={studentNumber}>
                                <th className="sticky left-0 z-1 bg-background pr-4 text-left">Student {studentNumber}</th>
                                {selectedClass.lessons.map((lesson) => (
                                    <td key={lesson.lesson_id} className="border px-2"></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

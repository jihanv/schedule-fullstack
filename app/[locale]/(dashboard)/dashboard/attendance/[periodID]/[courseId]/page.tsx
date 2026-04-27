import { getCoursesAndLessonsForPeriod } from "@/app/actions/timeperiod";
import { getAttendanceRosterForCourse } from "@/app/actions/attendance";

const MAX_STUDENTS = 5;
const TALLY_COLUMNS = ["停", "忌", "欠", "ホ", "停・忌", "欠時", "総授業時数"];
const DEFAULT_BASE_REQUIRED_HOURS = 100;
const TALLY_COLUMN_WIDTH = 40;
const getTallyRightOffset = (index: number) =>
    (TALLY_COLUMNS.length - index - 1) * TALLY_COLUMN_WIDTH;

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
    const rosterResult = await getAttendanceRosterForCourse({ courseId });
    const savedRosterCount = rosterResult.ok ? rosterResult.enrollments.length : 0;

    // Temporary visual slots until saved student roster data exists.
    const studentSlots = Array.from({ length: MAX_STUDENTS }, (_, index) => index + 1);
    return (
        <>
            <h1 className="text-2xl font-semibold">
                Attendance for {selectedClass.courseName}
            </h1>
            <p className="text-sm text-muted-foreground">
                Lessons found: {lessonCount}
            </p>
            <p className="text-sm text-muted-foreground">
                Saved roster students: {savedRosterCount}
            </p>
            <p className="text-sm text-muted-foreground">
                基準時数: {DEFAULT_BASE_REQUIRED_HOURS}
            </p>
            <h2 className="mt-6 text-lg font-semibold">Attendance grid</h2>
            <p className="text-sm text-muted-foreground">
                Student names and attendance marks will be saved here later.
            </p>
            <div className="mt-4 overflow-x-auto">
                <table className="border-separate border-spacing-0 text-sm">
                    <tbody>
                        <tr>
                            <th className="sticky left-0 z-1 bg-background pr-4 text-left">Date</th>
                            {selectedClass.lessons.map((lesson) => (
                                <td key={lesson.lesson_id} className="border px-2">
                                    {String(lesson.lessonDate)}
                                </td>
                            ))}
                            {TALLY_COLUMNS.map((label, index) => (
                                <th key={label} rowSpan={4} style={{ right: getTallyRightOffset(index), writingMode: "vertical-rl", textOrientation: "upright" }} className="sticky z-1 h-24 w-10 min-w-10 border bg-background px-0 text-center text-xs">
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
                        <tr>
                            <th className="sticky left-0 z-1 bg-background pr-4 text-left">Status</th>
                            {selectedClass.lessons.map((lesson) => (
                                <td key={lesson.lesson_id} className="border px-2 text-center">未実施</td>
                            ))}
                        </tr>
                        {studentSlots.map((studentNumber) => (
                            <tr key={studentNumber}>
                                <th className="sticky left-0 z-1 w-25 min-w-20 bg-background text-left whitespace-nowrap">
                                    Student {studentNumber}
                                </th>
                                {selectedClass.lessons.map((lesson) => (
                                    <td key={lesson.lesson_id} className="border px-2"></td>
                                ))}
                                {TALLY_COLUMNS.map((label, index) => (
                                    <td key={label} style={{ right: getTallyRightOffset(index) }} className="sticky z-1 w-10 min-w-10 border bg-background px-1 text-center text-xs">
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

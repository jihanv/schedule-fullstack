"use server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { Courses, TimePeriod } from "@/app/db/schema";

const getAttendanceRosterForCourseInputSchema = z.object({
  courseId: z.string().min(1),
});

export async function getAttendanceRosterForCourse(input: unknown) {
  const parsed = getAttendanceRosterForCourseInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid input",
      issues: parsed.error.issues,
    };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const courseRows = await db
    .select({ course_id: Courses.course_id })
    .from(Courses)
    .innerJoin(TimePeriod, eq(Courses.period_id, TimePeriod.period_id))
    .where(
      and(
        eq(Courses.course_id, parsed.data.courseId),
        eq(TimePeriod.user_id, userId),
      ),
    )
    .limit(1);

  if (!courseRows[0]) return { ok: false as const, error: "Not found" };

  return { ok: true as const, enrollments: [] };
}

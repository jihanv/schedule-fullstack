"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/app/db";
import { Courses, Lessons, TimePeriod } from "@/app/db/schema";

const inputSchema = z.object({
  periodId: z.string().min(1),
});

export async function getCoursesAndLessonsForPeriod(input: unknown) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid input",
      issues: parsed.error.issues,
    };
  }

  const { periodId } = parsed.data;

  // ✅ Ownership check: period must belong to signed-in user
  const period = await db
    .select({ period_id: TimePeriod.period_id })
    .from(TimePeriod)
    .where(
      and(eq(TimePeriod.period_id, periodId), eq(TimePeriod.user_id, userId)),
    )
    .limit(1);

  if (period.length === 0) {
    return { ok: false as const, error: "Not found" };
  }

  // 1) Courses for this period
  const courses = await db
    .select({
      course_id: Courses.course_id,
      period_id: Courses.period_id,
      courseName: Courses.courseName,
      createTs: Courses.createTs,
    })
    .from(Courses)
    .where(eq(Courses.period_id, periodId))
    .orderBy(asc(Courses.courseName));

  const courseIds = courses.map((c) => c.course_id);

  // 2) Lessons for those courses
  const lessons =
    courseIds.length === 0
      ? []
      : await db
          .select({
            lesson_id: Lessons.lesson_id,
            course_id: Lessons.course_id,
            lessonNumber: Lessons.lessonNumber,
            lessonDate: Lessons.lessonDate,
            timeSlot: Lessons.timeSlot,
            createTs: Lessons.createTs,
          })
          .from(Lessons)
          .where(inArray(Lessons.course_id, courseIds))
          .orderBy(
            asc(Lessons.lessonDate),
            asc(Lessons.timeSlot),
            asc(Lessons.lessonNumber),
          );

  // Group lessons under each course
  const lessonsByCourseId = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const arr = lessonsByCourseId.get(l.course_id) ?? [];
    arr.push(l);
    lessonsByCourseId.set(l.course_id, arr);
  }

  return {
    ok: true as const,
    periodId,
    courses: courses.map((c) => ({
      ...c,
      lessons: lessonsByCourseId.get(c.course_id) ?? [],
    })),
  };
}

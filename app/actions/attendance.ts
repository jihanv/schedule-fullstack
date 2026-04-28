"use server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/app/db";
import {
  AttendanceEnrollments,
  AttendanceStudents,
  Courses,
  TimePeriod,
} from "@/app/db/schema";

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

  const enrollments = await db
    .select({
      enrollment_id: AttendanceEnrollments.enrollment_id,
      rosterOrder: AttendanceEnrollments.rosterOrder,
      studentName: AttendanceStudents.studentName,
    })
    .from(AttendanceEnrollments)
    .innerJoin(
      AttendanceStudents,
      eq(AttendanceEnrollments.student_id, AttendanceStudents.student_id),
    )
    .where(eq(AttendanceEnrollments.course_id, parsed.data.courseId))
    .orderBy(asc(AttendanceEnrollments.rosterOrder));

  return { ok: true as const, enrollments };
}

const MAX_STUDENTS = 40;

const saveRosterStudentInputSchema = z.object({
  courseId: z.string().min(1),
  rosterOrder: z.number().int().min(1).max(MAX_STUDENTS),
  studentFirstName: z.string().trim().min(1),
  studentLastName: z.string().trim().min(1),
});

export async function saveRosterStudent(input: unknown) {
  const parsed = saveRosterStudentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid input",
      issues: parsed.error.issues,
    };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  return { ok: false as const, error: "Roster saving is not implemented yet" };
}

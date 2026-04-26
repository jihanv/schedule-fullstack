"use server";
import { z } from "zod";

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
  return { ok: true as const, enrollments: [] };
}

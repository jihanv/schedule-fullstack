// app/actions/get-saved-period-data.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { Courses, Holidays, Lessons, TimePeriod } from "@/app/db/schema";

const inputSchema = z.object({ periodId: z.string().min(1) });

function toYmd(v: unknown): string {
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v);
}

export async function getSavedPeriodData(input: unknown) {
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

  // Ownership check + period dates
  const periodRows = await db
    .select({
      period_id: TimePeriod.period_id,
      startDate: TimePeriod.startDate,
      endDate: TimePeriod.endDate,
    })
    .from(TimePeriod)
    .where(
      and(eq(TimePeriod.period_id, periodId), eq(TimePeriod.user_id, userId)),
    )
    .limit(1);

  const period = periodRows[0];
  if (!period) return { ok: false as const, error: "Not found" };

  const courses = await db
    .select({
      course_id: Courses.course_id,
      courseName: Courses.courseName,
    })
    .from(Courses)
    .where(eq(Courses.period_id, periodId))
    .orderBy(asc(Courses.courseName));

  const holidays = await db
    .select({
      holidayDate: Holidays.holidayDate,
      holidayName: Holidays.holidayName,
    })
    .from(Holidays)
    .where(eq(Holidays.period_id, periodId))
    .orderBy(asc(Holidays.holidayDate));

  const lessons = await db
    .select({
      lesson_id: Lessons.lesson_id,
      lessonDate: Lessons.lessonDate,
      timeSlot: Lessons.timeSlot,
      lessonNumber: Lessons.lessonNumber,
      course_id: Lessons.course_id,
      courseName: Courses.courseName,
    })
    .from(Lessons)
    .innerJoin(Courses, eq(Lessons.course_id, Courses.course_id))
    .where(eq(Courses.period_id, periodId))
    .orderBy(asc(Lessons.lessonDate), asc(Lessons.timeSlot));

  return {
    ok: true as const,
    period: {
      periodId,
      startDate: toYmd(period.startDate),
      endDate: toYmd(period.endDate),
    },
    courses,
    holidays: holidays.map((h) => ({
      holidayDate: toYmd(h.holidayDate),
      holidayName: h.holidayName ?? null,
    })),
    lessons: lessons.map((l) => ({
      ...l,
      lessonDate: toYmd(l.lessonDate),
    })),
  };
}

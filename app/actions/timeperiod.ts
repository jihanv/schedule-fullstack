"use server";

import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { and, desc, eq, asc, inArray } from "drizzle-orm";
import { db } from "@/app/db";
import { Courses, Holidays, Lessons, TimePeriod } from "@/app/db/schema";

// YYYY-MM-DD (simple format check)
function isRealYmdDate(ymd: string): boolean {
  // First ensure shape is exactly YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;

  const [year, month, day] = ymd.split("-").map(Number);

  // Build a UTC date and verify it round-trips to the same parts
  const d = new Date(Date.UTC(year, month - 1, day));

  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() + 1 === month &&
    d.getUTCDate() === day
  );
}

// YYYY-MM-DD + real calendar date check
const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  .refine(isRealYmdDate, "Invalid calendar date");

// schedule shape: { [day]: { [period]: "Section Name" | null } }
const scheduleSchema = z.record(
  z.string(), // day key (e.g. monday, tuesday...)
  z.record(
    z.string(), // period key (e.g. "1", "2", ...)
    z.union([z.string(), z.null()]),
  ),
);

const saveFullScheduleInputSchema = z
  .object({
    startDate: ymdSchema,
    endDate: ymdSchema,

    holidays: z.array(ymdSchema).default([]),

    // class names from your "sections"
    sections: z.array(z.string().min(1)).default([]),

    // weekly timetable template
    schedule: scheduleSchema,
    deletedLessons: z
      .array(
        z.object({
          dateKey: ymdSchema,
          period: z.number().int().positive(),
        }),
      )
      .default([]),
    manualLessons: z
      .array(
        z.object({
          dateKey: ymdSchema,
          period: z.number().int().positive(),
          section: z.string().min(1),
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    // Dates are in YYYY-MM-DD, so string comparison is safe here
    // (because all values are zero-padded and validated)
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }

    // Track holidays we've already seen so we can catch duplicates
    const seenHolidays = new Set<string>();

    // Every holiday must be inside the selected time period
    for (let i = 0; i < data.holidays.length; i++) {
      const holiday = data.holidays[i];

      if (holiday < data.startDate || holiday > data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["holidays", i],
          message: "Holiday must be within the selected date range",
        });
      }

      if (seenHolidays.has(holiday)) {
        ctx.addIssue({
          code: "custom",
          path: ["holidays", i],
          message: "Duplicate holiday date",
        });
      } else {
        seenHolidays.add(holiday);
      }
    }

    // Reject duplicate section names after trimming (e.g. "Math" and "Math ")
    const seenSections = new Set<string>();

    for (let i = 0; i < data.sections.length; i++) {
      const rawSection = data.sections[i];
      const trimmedSection = rawSection.trim();

      if (!trimmedSection) {
        // z.string().min(1) already catches empty strings,
        // but this catches strings like "   " after trimming.
        ctx.addIssue({
          code: "custom",
          path: ["sections", i],
          message: "Class name cannot be blank",
        });
        continue;
      }

      if (seenSections.has(trimmedSection)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", i],
          message: "Duplicate class name",
        });
      } else {
        seenSections.add(trimmedSection);
      }
    }
    // Validate deleted lesson exceptions
    const seenDeleted = new Set<string>();

    for (let i = 0; i < data.deletedLessons.length; i++) {
      const item = data.deletedLessons[i];
      const key = `${item.dateKey}|${item.period}`;

      // deleted lesson date must be inside the selected time period
      if (item.dateKey < data.startDate || item.dateKey > data.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["deletedLessons", i, "dateKey"],
          message: "Deleted lesson date must be within the selected date range",
        });
      }

      // no duplicates like same date+period twice
      if (seenDeleted.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["deletedLessons", i],
          message: "Duplicate deleted lesson entry",
        });
      } else {
        seenDeleted.add(key);
      }
    }
  });

type SaveFullScheduleInput = z.infer<typeof saveFullScheduleInputSchema>;

type SchedulePayload = z.infer<typeof scheduleSchema>;

type GeneratedLessonDraft = {
  courseName: string;
  lessonNumber: number;
  lessonDate: string; // YYYY-MM-DD
  timeSlot: number;
};

function parseYmdToUtcDate(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDateToYmd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getScheduleDayForDate(
  schedule: SchedulePayload,
  date: Date,
): Record<string, string | null> | null {
  // Normalize keys once for case-insensitive lookup
  const scheduleByLower = new Map(
    Object.entries(schedule).map(([key, value]) => [key.toLowerCase(), value]),
  );

  const jsDay = date.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat

  // Support both short keys (Mon) and full keys (monday)
  const aliasesByDay: Record<number, string[]> = {
    0: ["sun", "sunday"],
    1: ["mon", "monday"],
    2: ["tue", "tues", "tuesday"],
    3: ["wed", "wednesday"],
    4: ["thu", "thur", "thurs", "thursday"],
    5: ["fri", "friday"],
    6: ["sat", "saturday"],
  };

  const aliases = aliasesByDay[jsDay] ?? [];

  for (const alias of aliases) {
    const found = scheduleByLower.get(alias);
    if (found) return found;
  }

  return null;
}

function buildGeneratedLessons(params: {
  startDate: string;
  endDate: string;
  holidays: string[];
  schedule: SchedulePayload;
  allowedCourseNames: string[];
  deletedLessons: { dateKey: string; period: number }[];
  manualLessons: { dateKey: string; period: number; section: string }[];
}): GeneratedLessonDraft[] {
  const {
    startDate,
    endDate,
    holidays,
    schedule,
    allowedCourseNames,
    deletedLessons,
    manualLessons,
  } = params;

  const start = parseYmdToUtcDate(startDate);
  const end = parseYmdToUtcDate(endDate);

  const holidaySet = new Set(holidays);
  const allowedSet = new Set(allowedCourseNames);
  const deletedSet = new Set(
    deletedLessons.map((x) => `${x.dateKey}|${x.period}`),
  );

  // dateKey -> (period -> section)
  const manualByDate = new Map<string, Map<number, string>>();
  for (const ml of manualLessons) {
    const name = ml.section.trim();
    if (!name) continue;

    const byPeriod = manualByDate.get(ml.dateKey) ?? new Map<number, string>();
    byPeriod.set(ml.period, name);
    manualByDate.set(ml.dateKey, byPeriod);
  }

  const lessonCounters = new Map<string, number>();
  const generated: GeneratedLessonDraft[] = [];

  for (
    let current = start;
    current.getTime() <= end.getTime();
    current = addUtcDays(current, 1)
  ) {
    const ymd = formatUtcDateToYmd(current);

    // Skip holidays
    if (holidaySet.has(ymd)) continue;

    // Get weekly schedule row for this weekday (may be null)
    const dayPeriods = getScheduleDayForDate(schedule, current) ?? {};
    const manualPeriods = manualByDate.get(ymd) ?? new Map<number, string>();

    // If neither weekly schedule nor manual entries exist, skip the day
    if (Object.keys(dayPeriods).length === 0 && manualPeriods.size === 0)
      continue;

    // Build union of periods from weekly schedule + manual entries
    const periodSet = new Set<number>();

    for (const k of Object.keys(dayPeriods)) {
      const p = Number(k);
      if (Number.isInteger(p) && p > 0) periodSet.add(p);
    }
    for (const p of manualPeriods.keys()) {
      if (Number.isInteger(p) && p > 0) periodSet.add(p);
    }

    const sortedPeriods = Array.from(periodSet).sort((a, b) => a - b);

    for (const timeSlot of sortedPeriods) {
      const manualSection = manualPeriods.get(timeSlot);
      const scheduleSection = dayPeriods[String(timeSlot)] ?? null;

      // Manual wins for this slot; otherwise use weekly schedule
      const rawName = (manualSection ?? scheduleSection) as string | null;
      if (!rawName) continue;

      const trimmedName = rawName.trim();
      if (!trimmedName) continue;

      // Must be one of the saved sections
      if (!allowedSet.has(trimmedName)) continue;

      // deletedLessons only applies to weekly-schedule lessons (not manual)
      const isManual = !!manualSection;
      if (!isManual && deletedSet.has(`${ymd}|${timeSlot}`)) continue;

      const nextLessonNumber = (lessonCounters.get(trimmedName) ?? 0) + 1;
      lessonCounters.set(trimmedName, nextLessonNumber);

      generated.push({
        courseName: trimmedName,
        lessonNumber: nextLessonNumber,
        lessonDate: ymd,
        timeSlot,
      });
    }
  }

  return generated;
}

export async function saveFullSchedule(input: SaveFullScheduleInput) {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = saveFullScheduleInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid schedule payload",
      issues: parsed.error.issues,
    };
  }

  const data = parsed.data;
  console.log("saveFullSchedule counts:", {
    deletedLessons: data.deletedLessons.length,
    manualLessons: data.manualLessons.length,
  });
  try {
    const result = await db.transaction(async (tx) => {
      // Step 5: Save the time period row
      const inserted = await tx
        .insert(TimePeriod)
        .values({
          period_id: createId(),
          user_id: userId,
          startDate: data.startDate,
          endDate: data.endDate,
        })
        .returning({ period_id: TimePeriod.period_id });

      const periodId = inserted[0]?.period_id;

      if (!periodId) {
        throw new Error("Failed to create time period");
      }

      // Step 6: Save holidays linked to this time period
      if (data.holidays.length > 0) {
        await tx
          .insert(Holidays)
          .values(
            data.holidays.map((holidayDate) => ({
              holiday_id: createId(),
              period_id: periodId,
              holidayDate,
            })),
          )
          .onConflictDoNothing({
            target: [Holidays.period_id, Holidays.holidayDate],
          });
      }

      // Step 7: Save course/class names (sections) linked to this time period
      const uniqueSections = Array.from(
        new Set(data.sections.map((s) => s.trim()).filter((s) => s.length > 0)),
      );

      if (uniqueSections.length > 0) {
        await tx
          .insert(Courses)
          .values(
            uniqueSections.map((sectionName) => ({
              course_id: createId(),
              period_id: periodId,
              courseName: sectionName,
            })),
          )
          .onConflictDoNothing({
            target: [Courses.period_id, Courses.courseName],
          });
      }

      // Step 8: Generate lesson rows in memory (server-side)
      const generatedLessons = buildGeneratedLessons({
        startDate: data.startDate,
        endDate: data.endDate,
        holidays: data.holidays,
        schedule: data.schedule,
        allowedCourseNames: uniqueSections,
        deletedLessons: data.deletedLessons,
        manualLessons: data.manualLessons,
      });

      // Step 9: Load saved courses and map courseName -> course_id
      const savedCourses = await tx
        .select({
          course_id: Courses.course_id,
          courseName: Courses.courseName,
        })
        .from(Courses)
        .where(eq(Courses.period_id, periodId));

      const courseIdByName = new Map(
        savedCourses.map((course) => [course.courseName, course.course_id]),
      );

      const lessonRows = generatedLessons.map((lesson) => {
        const courseId = courseIdByName.get(lesson.courseName);

        if (!courseId) {
          throw new Error(
            `Could not find saved course_id for course "${lesson.courseName}"`,
          );
        }

        return {
          lesson_id: createId(),
          course_id: courseId,
          lessonNumber: lesson.lessonNumber,
          lessonDate: lesson.lessonDate,
          timeSlot: lesson.timeSlot,
        };
      });

      if (lessonRows.length > 0) {
        await tx.insert(Lessons).values(lessonRows);
      }

      return {
        ok: true as const,
        message: "Time period, holidays, courses, and lessons saved",
        period_id: periodId,
        summary: {
          startDate: data.startDate,
          endDate: data.endDate,
          holidayCount: data.holidays.length,
          sectionCount: uniqueSections.length,
          dayCount: Object.keys(data.schedule).length,
          generatedLessonCount: generatedLessons.length,
          savedLessonCount: lessonRows.length,
        },
      };
    });

    return result;
  } catch (error) {
    console.error("saveFullSchedule failed:", error);

    return {
      ok: false as const,
      error: "Failed to save schedule data",
    };
  }
}

// List all time periods for the signed-in user
const listSchema = z.object({
  limit: z.number().int().positive().max(200).optional(),
});

export async function getTimePeriodsForCurrentUser(input?: unknown) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const parsed = listSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid input",
      issues: parsed.error.issues,
    };
  }

  const { limit } = parsed.data;

  const rows = await db
    .select({
      period_id: TimePeriod.period_id,
      user_id: TimePeriod.user_id,
      startDate: TimePeriod.startDate,
      endDate: TimePeriod.endDate,
      createTs: TimePeriod.createTs,
    })
    .from(TimePeriod)
    .where(eq(TimePeriod.user_id, userId))
    .orderBy(desc(TimePeriod.startDate))
    .limit(limit ?? 200);

  return { ok: true as const, timePeriods: rows };
}

// Fetch a specific time period by id (must belong to signed-in user)
const byIdSchema = z.object({
  periodId: z.string().min(1),
});

export async function getTimePeriodById(input: unknown) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const parsed = byIdSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Invalid input",
      issues: parsed.error.issues,
    };
  }

  const { periodId } = parsed.data;

  const rows = await db
    .select({
      period_id: TimePeriod.period_id,
      user_id: TimePeriod.user_id,
      startDate: TimePeriod.startDate,
      endDate: TimePeriod.endDate,
      createTs: TimePeriod.createTs,
    })
    .from(TimePeriod)
    .where(
      and(eq(TimePeriod.period_id, periodId), eq(TimePeriod.user_id, userId)),
    )
    .limit(1);

  const period = rows[0];
  if (!period) return { ok: false as const, error: "Not found" };

  return { ok: true as const, timePeriod: period };
}

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

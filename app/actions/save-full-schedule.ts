"use server";

import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { db } from "@/app/db";
import { Holidays, TimePeriod } from "@/app/db/schema";

// YYYY-MM-DD (simple format check)
const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

// schedule shape: { [day]: { [period]: "Section Name" | null } }
const scheduleSchema = z.record(
  z.string(), // day key (e.g. monday, tuesday...)
  z.record(
    z.string(), // period key (e.g. "1", "2", ...)
    z.union([z.string(), z.null()]),
  ),
);

const saveFullScheduleInputSchema = z.object({
  startDate: ymdSchema,
  endDate: ymdSchema,

  holidays: z.array(ymdSchema).default([]),

  // class names from your "sections"
  sections: z.array(z.string().min(1)).default([]),

  // weekly timetable template
  schedule: scheduleSchema,
});

type SaveFullScheduleInput = z.infer<typeof saveFullScheduleInputSchema>;

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

  try {
    // Step 5: Save the time period row
    const inserted = await db
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
      await db
        .insert(Holidays)
        .values(
          data.holidays.map((holidayDate) => ({
            holiday_id: createId(),
            period_id: periodId,
            holidayDate,
          })),
        )
        .onConflictDoNothing({
          // requires unique(period_id, holiday_date) in your schema
          target: [Holidays.period_id, Holidays.holidayDate],
        });
    }

    return {
      ok: true as const,
      message: "Time period and holidays saved",
      period_id: periodId,
      summary: {
        startDate: data.startDate,
        endDate: data.endDate,
        holidayCount: data.holidays.length,
        sectionCount: data.sections.length,
        dayCount: Object.keys(data.schedule).length,
      },
    };
  } catch (error) {
    console.error("saveFullSchedule failed while saving time period:", error);

    return {
      ok: false as const,
      error: "Failed to save time period",
    };
  }
}

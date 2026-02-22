"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

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

  // For now, we are ONLY validating and returning a stub response.
  // DB transaction will come in the next steps.
  const data = parsed.data;

  return {
    ok: true as const,
    message: "Payload validated on server",
    summary: {
      startDate: data.startDate,
      endDate: data.endDate,
      holidayCount: data.holidays.length,
      sectionCount: data.sections.length,
      dayCount: Object.keys(data.schedule).length,
    },
  };
}

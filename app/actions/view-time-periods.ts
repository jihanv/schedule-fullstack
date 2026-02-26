"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { TimePeriod } from "@/app/db/schema";

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

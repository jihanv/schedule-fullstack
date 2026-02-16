"use server";

import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/app/db";
import { TimePeriod } from "@/app/db/schema";
import { periodInputSchema } from "@/lib/time-period-validator";

type SaveState =
  | { ok: true; period_id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveTimePeriod(
  prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  // 1) AUTH FIRST (server-side)
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Unauthorized" }; // Clerk auth check :contentReference[oaicite:1]{index=1}

  // 2) Read inputs from the form
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  // 3) Validate (your Zod schema)
  const parsed = periodInputSchema.safeParse({ startDate, endDate });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  // 4) Insert (server generates period_id)
  const inserted = await db
    .insert(TimePeriod)
    .values({
      period_id: createId(),
      user_id: userId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    })
    .returning({ period_id: TimePeriod.period_id });

  return { ok: true, period_id: inserted[0].period_id };
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/app/db"; // from your app/db/index.ts
import { TimePeriod } from "@/app/db/schema"; // from your app/db/schema.ts

// We expect the client to send "YYYY-MM-DD" strings.
// This avoids timezone bugs that happen when sending full ISO timestamps.
const bodySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be the same day or after startDate",
    path: ["endDate"],
  });

export async function POST(req: Request) {
  // 1) ✅ AUTH FIRST
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Read + validate the body
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { startDate, endDate } = parsed.data;

  // 3) Insert into DB (period_id generated on the server)
  const inserted = await db
    .insert(TimePeriod)
    .values({
      period_id: createId(),
      user_id: userId,
      startDate, // your schema uses date("start_date")
      endDate, // your schema uses date("end_date")
      // completed + createTs will use DB defaults from schema
    })
    .returning({ period_id: TimePeriod.period_id });

  // returning() gives an array; we inserted one row so take [0]
  return NextResponse.json(
    { ok: true, period_id: inserted[0].period_id },
    { status: 201 },
  );
}

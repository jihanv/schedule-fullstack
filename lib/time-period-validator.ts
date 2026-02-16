import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const periodInputSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    // Because it's YYYY-MM-DD, string comparison works for ordering
    if (endDate < startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate must be the same day or after startDate",
      });
    }

    const days = differenceInCalendarDays(
      parseISO(endDate),
      parseISO(startDate),
    );
    if (days > 183) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Date range cannot be longer than 183 days",
      });
    }
  });

export function buildPeriodRow(input: unknown, userId: string) {
  const { startDate, endDate } = periodInputSchema.parse(input);

  return {
    period_id: createId(),
    user_id: userId,
    startDate, // <-- keep as "YYYY-MM-DD"
    endDate, // <-- keep as "YYYY-MM-DD"
  };
}

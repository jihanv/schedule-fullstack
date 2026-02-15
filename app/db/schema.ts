/// app/db/schema.ts

import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";

export const TimePeriod = pgTable("time_period", {
  period_id: text("period_id").primaryKey(),
  user_id: text("user_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createTs: timestamp("create_ts").defaultNow().notNull(),
});

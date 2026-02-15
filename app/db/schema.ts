/// app/db/schema.ts

import {
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["free", "paid"]);

export const Users = pgTable(
  "users",
  {
    user_id: text("user_id").primaryKey().notNull(), // Clerk userId
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    accountType: accountTypeEnum("account_type").default("free").notNull(),
    createTs: timestamp("create_ts").defaultNow().notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export const TimePeriod = pgTable("time_period", {
  period_id: text("period_id").primaryKey().notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => Users.user_id, {
      onDelete: "cascade", // optional: delete time periods if user is deleted
      onUpdate: "cascade", // optional
    }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createTs: timestamp("create_ts").defaultNow().notNull(),
});

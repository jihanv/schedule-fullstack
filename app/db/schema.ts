/// app/db/schema.ts
/// app/db/schema.ts

import {
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  boolean,
  index, // ✅ added
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
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const TimePeriod = pgTable("time_period", {
  period_id: text("period_id").primaryKey().notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => Users.user_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createTs: timestamp("create_ts").defaultNow().notNull(),
});

export const Courses = pgTable(
  "lessons",
  {
    course_id: text("lesson_id").primaryKey().notNull(),
    period_id: text("period_id")
      .notNull()
      .references(() => TimePeriod.period_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    courseName: text("lesson_name").notNull(),
    createTs: timestamp("create_ts").defaultNow().notNull(),
  },
  (t) => [
    // Fast lookup when opening a time period and loading its class list
    index("lessons_period_id_idx").on(t.period_id),

    // Prevent duplicate class names inside the same time period (optional but recommended)
    uniqueIndex("lessons_period_lesson_name_unique").on(
      t.period_id,
      t.courseName,
    ),
  ],
);

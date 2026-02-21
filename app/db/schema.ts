/// app/db/schema.ts

import {
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  boolean,
  index,
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

export const TimePeriod = pgTable(
  "time_period",
  {
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
  },
  (t) => [index("time_period_user_id_idx").on(t.user_id)],
);

export const Courses = pgTable(
  "courses",
  {
    course_id: text("course_id").primaryKey().notNull(),
    period_id: text("period_id")
      .notNull()
      .references(() => TimePeriod.period_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    courseName: text("course_name").notNull(),
    createTs: timestamp("create_ts").defaultNow().notNull(),
  },
  (t) => [
    // Prevent duplicate class names inside the same time period (optional but recommended)
    uniqueIndex("courses_period_lesson_name_unique").on(
      t.period_id,
      t.courseName,
    ),
  ],
);

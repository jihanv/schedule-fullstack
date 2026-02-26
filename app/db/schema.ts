/// app/db/schema.ts

import {
  pgTable,
  text,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  index,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["free", "paid"]);

export const Users = pgTable(
  "users",
  {
    user_id: text("user_id").primaryKey().notNull(), // Clerk userId
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    schoolId: text("school_id"), // or .notNull() if required
    ON: boolean("on").default(false).notNull(), // boolean column named "on" in DB
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

export const Lessons = pgTable(
  "lessons",
  {
    lesson_id: text("lesson_id").primaryKey().notNull(),

    course_id: text("course_id")
      .notNull()
      .references(() => Courses.course_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    lessonNumber: integer("lesson_number").notNull(), // 1, 2, 3, ...
    lessonDate: date("lesson_date").notNull(),
    timeSlot: integer("time_slot").notNull(), // 1 - 8

    createTs: timestamp("create_ts").defaultNow().notNull(),
  },
  (t) => [
    index("lessons_course_id_idx").on(t.course_id),

    // Prevent duplicate lesson numbers inside the same course
    uniqueIndex("lessons_course_lesson_number_unique").on(
      t.course_id,
      t.lessonNumber,
    ),

    // Prevent duplicate scheduling inside the same course
    uniqueIndex("lessons_course_date_slot_unique").on(
      t.course_id,
      t.lessonDate,
      t.timeSlot,
    ),
  ],
);
export const holidaySourceEnum = pgEnum("holiday_source", ["manual", "api"]);

export const Holidays = pgTable(
  "holidays",
  {
    holiday_id: text("holiday_id").primaryKey().notNull(),

    period_id: text("period_id")
      .notNull()
      .references(() => TimePeriod.period_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    holidayDate: date("holiday_date").notNull(),

    // Optional label (e.g. "Labor Day", "Coming of Age Day")
    holidayName: text("holiday_name"),

    // Whether user added it manually or from holiday API import
    source: holidaySourceEnum("source").default("manual").notNull(),

    // Optional metadata for imported holidays
    countryCode: text("country_code"),

    createTs: timestamp("create_ts").defaultNow().notNull(),
  },
  (t) => [
    index("holidays_period_id_idx").on(t.period_id),

    // Prevent duplicate holiday dates inside the same time period
    uniqueIndex("holidays_period_date_unique").on(t.period_id, t.holidayDate),
  ],
);

CREATE TYPE "public"."weekday" AS ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');--> statement-breakpoint
CREATE TABLE "weekly_template_slots" (
	"template_slot_id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"course_id" text NOT NULL,
	"weekday" "weekday" NOT NULL,
	"time_slot" integer NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_template_slots" ADD CONSTRAINT "weekly_template_slots_period_id_time_period_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_period"("period_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "weekly_template_slots" ADD CONSTRAINT "weekly_template_slots_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "weekly_template_slots_period_id_idx" ON "weekly_template_slots" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "weekly_template_slots_course_id_idx" ON "weekly_template_slots" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_template_slots_period_weekday_slot_unique" ON "weekly_template_slots" USING btree ("period_id","weekday","time_slot");
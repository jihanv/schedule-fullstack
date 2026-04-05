CREATE TABLE "manual_lesson_overrides" (
	"manual_lesson_override_id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_date" date NOT NULL,
	"time_slot" integer NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manual_lesson_overrides" ADD CONSTRAINT "manual_lesson_overrides_period_id_time_period_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_period"("period_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "manual_lesson_overrides" ADD CONSTRAINT "manual_lesson_overrides_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "manual_lesson_overrides_period_id_idx" ON "manual_lesson_overrides" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "manual_lesson_overrides_course_id_idx" ON "manual_lesson_overrides" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "manual_lesson_overrides_period_date_slot_unique" ON "manual_lesson_overrides" USING btree ("period_id","lesson_date","time_slot");
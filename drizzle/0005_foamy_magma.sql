CREATE TABLE "lessons" (
	"lesson_id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"lesson_number" integer NOT NULL,
	"lesson_date" date NOT NULL,
	"time_slot" integer NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "lessons_course_id_idx" ON "lessons" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_course_lesson_number_unique" ON "lessons" USING btree ("course_id","lesson_number");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_course_date_slot_unique" ON "lessons" USING btree ("course_id","lesson_date","time_slot");
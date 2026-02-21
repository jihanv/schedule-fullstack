CREATE TABLE "courses" (
	"course_id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"course_name" text NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_period_id_time_period_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_period"("period_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_period_lesson_name_unique" ON "courses" USING btree ("period_id","course_name");--> statement-breakpoint
CREATE INDEX "time_period_user_id_idx" ON "time_period" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "time_period" DROP COLUMN "completed";
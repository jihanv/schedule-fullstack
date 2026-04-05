CREATE TABLE "deleted_lesson_exceptions" (
	"deleted_lesson_exception_id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"lesson_date" date NOT NULL,
	"time_slot" integer NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deleted_lesson_exceptions" ADD CONSTRAINT "deleted_lesson_exceptions_period_id_time_period_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_period"("period_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "deleted_lesson_exceptions_period_id_idx" ON "deleted_lesson_exceptions" USING btree ("period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deleted_lesson_exceptions_period_date_slot_unique" ON "deleted_lesson_exceptions" USING btree ("period_id","lesson_date","time_slot");
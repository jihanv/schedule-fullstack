CREATE TYPE "public"."holiday_source" AS ENUM('manual', 'api');--> statement-breakpoint
CREATE TABLE "holidays" (
	"holiday_id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"holiday_date" date NOT NULL,
	"holiday_name" text,
	"source" "holiday_source" DEFAULT 'manual' NOT NULL,
	"country_code" text,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_period_id_time_period_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_period"("period_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "holidays_period_id_idx" ON "holidays" USING btree ("period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "holidays_period_date_unique" ON "holidays" USING btree ("period_id","holiday_date");
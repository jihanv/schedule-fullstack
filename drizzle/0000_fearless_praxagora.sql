CREATE TABLE "time_period" (
	"period_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);

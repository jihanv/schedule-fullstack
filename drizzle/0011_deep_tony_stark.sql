CREATE TABLE "attendance_students" (
	"student_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"student_name" text NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_students" ADD CONSTRAINT "attendance_students_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "attendance_students_user_id_idx" ON "attendance_students" USING btree ("user_id");
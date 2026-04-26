CREATE TYPE "public"."attendance_status" AS ENUM('present', 'mourning', 'suspension', 'official', 'absent', 'home');--> statement-breakpoint
CREATE TABLE "attendance_enrollments" (
	"enrollment_id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"course_id" text NOT NULL,
	"roster_order" integer NOT NULL,
	"create_ts" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_enrollments" ADD CONSTRAINT "attendance_enrollments_student_id_attendance_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."attendance_students"("student_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "attendance_enrollments" ADD CONSTRAINT "attendance_enrollments_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_enrollments_course_student_unique" ON "attendance_enrollments" USING btree ("course_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_enrollments_course_order_unique" ON "attendance_enrollments" USING btree ("course_id","roster_order");
CREATE TYPE "public"."comment_status" AS ENUM('active', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('pending', 'approved', 'rejected', 'deleted', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('admin', 'student', 'mentor');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"user_id" integer,
	"content" varchar(1000) NOT NULL,
	"status" "comment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"student_id" integer,
	"is_leader" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"status" "project_status" DEFAULT 'pending' NOT NULL,
	"mentor_id" integer,
	"tech_stack" varchar(1000) NOT NULL,
	"course" varchar(255) NOT NULL,
	"semester" varchar(255) NOT NULL,
	"section" varchar(255) NOT NULL,
	"start_date" timestamp NOT NULL,
	"submission_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_roles" DEFAULT 'student' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_students" ADD CONSTRAINT "project_students_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_students" ADD CONSTRAINT "project_students_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
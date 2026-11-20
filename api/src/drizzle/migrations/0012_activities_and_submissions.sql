CREATE TABLE "Activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"allow_late_submissions" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "Submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity" uuid NOT NULL,
	"group" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"is_late" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grade" real,
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Submission_activity_group_unique" UNIQUE("activity","group")
);
--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_activity_Activity_id_fk" FOREIGN KEY ("activity") REFERENCES "public"."Activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_group_Group_id_fk" FOREIGN KEY ("group") REFERENCES "public"."Group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submitted_by_User_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_graded_by_User_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
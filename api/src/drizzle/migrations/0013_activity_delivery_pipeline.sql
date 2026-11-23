CREATE TYPE "public"."activity_submission_type" AS ENUM('links', 'files', 'both');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_published';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_updated';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_deadline_week';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_deadline_three_days';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_deadline_today';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'activity_submission_created';--> statement-breakpoint

ALTER TABLE "Activity" RENAME COLUMN "due_date" TO "due_at";--> statement-breakpoint
ALTER TABLE "Activity" RENAME COLUMN "created_by" TO "created_by_id";--> statement-breakpoint
ALTER TABLE "Activity" ADD COLUMN "submission_type" "activity_submission_type" DEFAULT 'links' NOT NULL;--> statement-breakpoint
ALTER TABLE "Activity" ADD COLUMN "published_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Activity" ADD COLUMN "deadline_revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "Activity" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "Activity" ALTER COLUMN "submission_type" DROP DEFAULT;--> statement-breakpoint

ALTER TABLE "Submission" RENAME TO "ActivitySubmission";--> statement-breakpoint
ALTER TABLE "ActivitySubmission" RENAME COLUMN "activity" TO "activity_id";--> statement-breakpoint
ALTER TABLE "ActivitySubmission" RENAME COLUMN "group" TO "group_id";--> statement-breakpoint
ALTER TABLE "ActivitySubmission" RENAME COLUMN "submitted_by" TO "submitted_by_id";--> statement-breakpoint
ALTER TABLE "ActivitySubmission" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ActivitySubmission" ALTER COLUMN "version" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ActivitySubmission" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ActivitySubmission" DROP CONSTRAINT "Submission_activity_group_unique";--> statement-breakpoint

CREATE TABLE "ActivityAttachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ActivityEvaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"evaluated_by_id" uuid NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ActivityEvaluation_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "ActivityEvaluation_score_range" CHECK ("ActivityEvaluation"."score" between 0 and 100)
);--> statement-breakpoint
CREATE TABLE "ActivityGroup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ActivitySubmissionFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ActivitySubmissionLink" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"repository_id" uuid,
	"url" varchar(2048) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "ActivityView" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "BucketFile" ADD COLUMN "mime_type" varchar(255);--> statement-breakpoint
ALTER TABLE "BucketFile" ADD COLUMN "uploaded_by_id" uuid;--> statement-breakpoint
ALTER TABLE "Notification" ADD COLUMN "activity_id" uuid;--> statement-breakpoint
ALTER TABLE "Notification" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "Notification" ADD COLUMN "actor_id" uuid;--> statement-breakpoint
ALTER TABLE "Notification" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "Notification" ADD COLUMN "deadline_revision" integer;--> statement-breakpoint

INSERT INTO "ActivityGroup" ("activity_id", "group_id")
SELECT "Activity"."id", "Group"."id"
FROM "Activity"
CROSS JOIN "Group"
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "ActivitySubmissionLink" ("submission_id", "url")
SELECT "id", "url"
FROM "ActivitySubmission"
WHERE "url" IS NOT NULL;--> statement-breakpoint
INSERT INTO "ActivityEvaluation" (
	"submission_id",
	"score",
	"evaluated_by_id",
	"evaluated_at",
	"updated_at"
)
SELECT
	"id",
	GREATEST(0, LEAST(100, ROUND("grade")::integer)),
	"graded_by",
	COALESCE("graded_at", "updated_at"),
	"updated_at"
FROM "ActivitySubmission"
WHERE "grade" IS NOT NULL AND "graded_by" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "ActivityAttachment" ADD CONSTRAINT "ActivityAttachment_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityAttachment" ADD CONSTRAINT "ActivityAttachment_file_id_BucketFile_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."BucketFile"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_submission_id_ActivitySubmission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."ActivitySubmission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityEvaluation" ADD CONSTRAINT "ActivityEvaluation_evaluated_by_id_User_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityGroup" ADD CONSTRAINT "ActivityGroup_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivitySubmissionFile" ADD CONSTRAINT "ActivitySubmissionFile_submission_id_ActivitySubmission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."ActivitySubmission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivitySubmissionFile" ADD CONSTRAINT "ActivitySubmissionFile_file_id_BucketFile_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."BucketFile"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivitySubmissionLink" ADD CONSTRAINT "ActivitySubmissionLink_submission_id_ActivitySubmission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."ActivitySubmission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivitySubmissionLink" ADD CONSTRAINT "ActivitySubmissionLink_repository_id_Repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."Repository"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityView" ADD CONSTRAINT "ActivityView_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityView" ADD CONSTRAINT "ActivityView_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityView" ADD CONSTRAINT "ActivityView_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BucketFile" ADD CONSTRAINT "BucketFile_uploaded_by_id_User_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_submission_id_ActivitySubmission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."ActivitySubmission"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actor_id_User_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "ActivityAttachment_activity_file_unique" ON "ActivityAttachment" USING btree ("activity_id", "file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ActivityGroup_activity_group_unique" ON "ActivityGroup" USING btree ("activity_id", "group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ActivitySubmissionFile_submission_file_unique" ON "ActivitySubmissionFile" USING btree ("submission_id", "file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ActivitySubmissionLink_submission_url_unique" ON "ActivitySubmissionLink" USING btree ("submission_id", "url");--> statement-breakpoint
CREATE UNIQUE INDEX "ActivitySubmission_activity_group_version_unique" ON "ActivitySubmission" USING btree ("activity_id", "group_id", "version");--> statement-breakpoint
CREATE UNIQUE INDEX "ActivityView_activity_user_unique" ON "ActivityView" USING btree ("activity_id", "user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Notification_activity_reminder_unique" ON "Notification" USING btree ("user_id", "activity_id", "group_id", "type", "deadline_revision") WHERE "Notification"."activity_id" IS NOT NULL AND "Notification"."group_id" IS NOT NULL AND "Notification"."deadline_revision" IS NOT NULL;

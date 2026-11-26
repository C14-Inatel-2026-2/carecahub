CREATE TABLE "ActivityClassroom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Classroom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"semester" varchar(6) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Group" ADD COLUMN "classroom_id" uuid;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "classroom_id" uuid;--> statement-breakpoint
INSERT INTO "Classroom" ("name", "semester")
SELECT DISTINCT "classroom", '2026.2'
FROM "User"
WHERE "classroom" IS NOT NULL;--> statement-breakpoint
UPDATE "User" AS "user"
SET "classroom_id" = "classroom"."id"
FROM "Classroom" AS "classroom"
WHERE "classroom"."semester" = '2026.2'
  AND "classroom"."name" = "user"."classroom";--> statement-breakpoint
UPDATE "Group" AS "group"
SET "classroom_id" = "leader"."classroom_id"
FROM "User" AS "leader"
WHERE "leader"."id" = "group"."leader_id";--> statement-breakpoint
ALTER TABLE "ActivityClassroom" ADD CONSTRAINT "ActivityClassroom_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityClassroom" ADD CONSTRAINT "ActivityClassroom_classroom_id_Classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."Classroom"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ActivityClassroom_activity_classroom_unique" ON "ActivityClassroom" USING btree ("activity_id","classroom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "Classroom_semester_name_unique" ON "Classroom" USING btree ("semester","name");--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_classroom_id_Classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."Classroom"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_classroom_id_Classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."Classroom"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "ActivityClassroom" ("activity_id", "classroom_id")
SELECT DISTINCT "activity_group"."activity_id", "group"."classroom_id"
FROM "ActivityGroup" AS "activity_group"
INNER JOIN "Group" AS "group" ON "group"."id" = "activity_group"."group_id"
WHERE "group"."classroom_id" IS NOT NULL
ON CONFLICT ("activity_id", "classroom_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "classroom";

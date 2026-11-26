ALTER TABLE "ActivitySubmission" ADD COLUMN "invalidated_at" timestamp with time zone;--> statement-breakpoint
WITH ranked_submissions AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "activity_id", "group_id"
      ORDER BY "version" DESC
    ) AS position
  FROM "ActivitySubmission"
)
UPDATE "ActivitySubmission"
SET "invalidated_at" = "updated_at"
FROM ranked_submissions
WHERE "ActivitySubmission"."id" = ranked_submissions."id"
  AND ranked_submissions.position > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "ActivitySubmission_valid_unique" ON "ActivitySubmission" USING btree ("activity_id","group_id") WHERE "ActivitySubmission"."invalidated_at" is null;

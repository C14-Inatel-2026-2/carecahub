ALTER TABLE "Project" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "description" text DEFAULT 'Projeto migrado sem descrição.' NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "technologies" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "uses_other_technology" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "other_technology" varchar(100);--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "dependency_manager" varchar(50) DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "other_dependency_manager" varchar(100);--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "version_control" varchar(50) DEFAULT 'git' NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "other_version_control" varchar(100);--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "repository_type" "repository_type";--> statement-breakpoint

UPDATE "Project" AS project
SET
	"group_id" = inferred."group_id",
	"repository_type" = inferred."repository_type"
FROM (
	SELECT
		repository."project" AS "project_id",
		MIN(app_user."group_id"::text)::uuid AS "group_id",
		CASE
			WHEN COUNT(*) > 1 THEN 'multirepo'::"repository_type"
			ELSE MIN(repository."repository_type"::text)::"repository_type"
		END AS "repository_type"
	FROM "Repository" AS repository
	INNER JOIN "User" AS app_user ON app_user."id" = repository."owner"
	WHERE repository."deleted_at" IS NULL
	GROUP BY repository."project"
	HAVING
		COUNT(DISTINCT app_user."group_id") = 1
		AND COUNT(*) FILTER (WHERE app_user."group_id" IS NULL) = 0
) AS inferred
WHERE project."id" = inferred."project_id";--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "Project"
		WHERE "group_id" IS NULL OR "repository_type" IS NULL
	) THEN
		RAISE EXCEPTION 'Não foi possível associar todos os projetos existentes a um único grupo. Associe os responsáveis dos repositórios a grupos antes de executar esta migração.';
	END IF;

	IF EXISTS (
		SELECT "group_id"
		FROM "Project"
		WHERE "deleted_at" IS NULL
		GROUP BY "group_id"
		HAVING COUNT(*) > 1
	) THEN
		RAISE EXCEPTION 'Há mais de um projeto ativo associado ao mesmo grupo. Mantenha somente um projeto ativo por grupo antes de executar esta migração.';
	END IF;
END
$$;--> statement-breakpoint

ALTER TABLE "Project" ALTER COLUMN "group_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "repository_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "description" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "technologies" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "dependency_manager" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "version_control" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "Project_active_group_unique" ON "Project" USING btree ("group_id") WHERE "Project"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "Repository" DROP COLUMN "repository_type";

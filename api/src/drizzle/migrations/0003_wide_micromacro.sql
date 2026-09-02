CREATE TYPE "public"."repository_type" AS ENUM('monorepo', 'multirepo');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
ALTER TABLE "Repository" ADD COLUMN "repository_type" "repository_type" NOT NULL;
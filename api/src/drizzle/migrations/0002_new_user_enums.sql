ALTER TABLE "User" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'student'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
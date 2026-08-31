CREATE TABLE "Project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "Repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(255),
	"owner" uuid,
	"project" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "Repository_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "registration" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "github_name" varchar(39);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "classroom" varchar(2);--> statement-breakpoint
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_owner_User_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_project_Project_id_fk" FOREIGN KEY ("project") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_registration_unique" UNIQUE("registration");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_github_name_unique" UNIQUE("github_name");
CREATE TABLE "Group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"friendly_id" varchar(30) NOT NULL,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_creator_id_User_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE set null ON UPDATE no action;
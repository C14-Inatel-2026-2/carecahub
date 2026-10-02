CREATE TYPE "public"."group_invite_status" AS ENUM('pending', 'accepted', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('group_invite');--> statement-breakpoint
CREATE TABLE "GroupInvite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_id" uuid NOT NULL,
	"status" "group_invite_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"group_invite_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "Notification_group_invite_id_unique" UNIQUE("group_invite_id")
);
--> statement-breakpoint
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_group_id_Group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_inviter_id_User_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_invitee_id_User_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_group_invite_id_GroupInvite_id_fk" FOREIGN KEY ("group_invite_id") REFERENCES "public"."GroupInvite"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "GroupInvite_pending_group_invitee_unique" ON "GroupInvite" USING btree ("group_id","invitee_id") WHERE "GroupInvite"."status" = 'pending' and "GroupInvite"."deleted_at" is null;
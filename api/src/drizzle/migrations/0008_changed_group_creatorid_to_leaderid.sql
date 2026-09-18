ALTER TABLE "Group" RENAME COLUMN "creator_id" TO "leader_id";--> statement-breakpoint
ALTER TABLE "Group" DROP CONSTRAINT "Group_creator_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Group" ADD CONSTRAINT "Group_leader_id_User_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
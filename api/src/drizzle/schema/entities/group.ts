import {
  type AnyPgColumn,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./user";

const groupTable = pgTable("Group", {
  id: uuid("id").defaultRandom().primaryKey(),
  friendlyId: varchar("friendly_id", { length: 30 }).notNull(),
  creatorId: uuid("creator_id")
    .references((): AnyPgColumn => users.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const groupPublicColumns = {
  id: groupTable.id,
  friendlyId: groupTable.friendlyId,
  creatorId: groupTable.creatorId,
  createdAt: groupTable.createdAt,
  updatedAt: groupTable.updatedAt,
  deletedAt: groupTable.deletedAt,
};

export { groupTable as groups };

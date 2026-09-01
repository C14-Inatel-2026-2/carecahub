import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./project";
import { users } from "./user";
import { repositoryTypeEnum } from "../enums/repositoryEnums";

const repositoryTable = pgTable("Repository", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: varchar("url", { length: 255 }).notNull().unique(),
  repositoryType: repositoryTypeEnum("repository_type").notNull(),
  ownerId: uuid("owner")
    .notNull()
    .references(() => users.id),
  projectId: uuid("project")
    .notNull()
    .references(() => projects.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

const repositoryRelations = relations(repositoryTable, ({ one }) => ({
  owner: one(users, {
    fields: [repositoryTable.ownerId],
    references: [users.id],
  }),

  project: one(projects, {
    fields: [repositoryTable.projectId],
    references: [projects.id],
  }),
}));

export { repositoryRelations, repositoryTable as repositories };

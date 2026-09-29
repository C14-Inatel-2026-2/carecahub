import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { repositoryTypeEnum } from "../enums";

const projectTable = pgTable("Project", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectName: varchar("project_name", { length: 255 }).notNull().unique(),
  repositoryType: repositoryTypeEnum("repository_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export { projectTable as projects };

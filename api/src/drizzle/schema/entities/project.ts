import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  char,
} from "drizzle-orm/pg-core";
import { repositoryTypeEnum } from "../enums";
import { groups } from "./group";

const projectTable = pgTable(
  "Project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "restrict" }),
    projectName: varchar("project_name", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    technologies: text("technologies").array().notNull(),
    usesOtherTechnology: boolean("uses_other_technology")
      .notNull()
      .default(false),
    otherTechnology: varchar("other_technology", { length: 100 }),
    dependencyManager: varchar("dependency_manager", { length: 50 }).notNull(),
    otherDependencyManager: varchar("other_dependency_manager", {
      length: 100,
    }),
    versionControl: varchar("version_control", { length: 50 }).notNull(),
    otherVersionControl: varchar("other_version_control", { length: 100 }),
    repositoryType: repositoryTypeEnum("repository_type").notNull(),
    iconUrl: text("icon_url"),
    thumbnailUrl: text("thumbnail_url"),
    mainColor: char("main_color", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("Project_active_group_unique")
      .on(table.groupId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export { projectTable as projects };

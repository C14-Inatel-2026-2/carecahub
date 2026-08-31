import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const projectTable = pgTable("Project", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export { projectTable as projects };

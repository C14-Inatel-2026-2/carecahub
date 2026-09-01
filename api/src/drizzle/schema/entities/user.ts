import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum } from "../enums/userEnums";

const userTable = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  registration: integer("registration").notNull().unique(),
  githubName: varchar("github_name", { length: 39 }).unique(),
  classroom: varchar("classroom", { length: 2 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  role: userRoleEnum("role").notNull().default("student"),
  status: userStatusEnum("status").notNull().default("active"),
  two_factor: boolean("two_factor").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});

export { userTable as users };

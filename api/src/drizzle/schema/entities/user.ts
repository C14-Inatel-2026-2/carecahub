import {
  type AnyPgColumn,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum } from "../enums/userEnums";
import { groups } from "./group";

const userTable = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  groupId: uuid("group_id").references((): AnyPgColumn => groups.id, {
    onDelete: "set null",
  }),
  registration: integer("registration").unique(),
  githubName: varchar("github_name", { length: 39 }).unique(),
  classroom: varchar("classroom", { length: 2 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  role: userRoleEnum("role").notNull().default("student"),
  status: userStatusEnum("status").notNull().default("active"),
  two_factor: boolean("two_factor").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const userPublicColumns = {
  id: userTable.id,
  name: userTable.name,
  registration: userTable.registration,
  githubName: userTable.githubName,
  classroom: userTable.classroom,
  email: userTable.email,
  role: userTable.role,
  status: userTable.status,
  two_factor: userTable.two_factor,
  createdAt: userTable.createdAt,
  updatedAt: userTable.updatedAt,
  deletedAt: userTable.deletedAt,
};

export { userTable as users };

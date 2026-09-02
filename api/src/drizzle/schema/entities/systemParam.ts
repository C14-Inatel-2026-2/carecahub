import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const systemParamTable = pgTable("SystemParam", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export { systemParamTable as systemParams };

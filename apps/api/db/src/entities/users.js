import { uuid, pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('User', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: text('password').notNull(),
    name: varchar('name', { length: 255 }).notNull()
});

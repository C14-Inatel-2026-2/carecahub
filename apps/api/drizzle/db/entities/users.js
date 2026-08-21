import { integer, pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('User', {
    id: integer('id').primaryKey().generated(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: text('password').notNull(),
    name: varchar('name', { length: 255 }).notNull()
});
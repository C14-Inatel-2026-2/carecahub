import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './user'

const bucketFileTable = pgTable('BucketFile', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  filename: varchar('filename', { length: 255 }).notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 255 }),
  uploadedById: uuid('uploaded_by_id').references(() => users.id, {
    onDelete: 'restrict',
  }),
  url: text('url').notNull().default(''),
  is_public: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export { bucketFileTable as bucketFiles }

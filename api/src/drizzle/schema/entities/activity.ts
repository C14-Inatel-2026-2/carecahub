import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { activitySubmissionTypeEnum } from '../enums/activityEnums'
import { bucketFiles } from './bucketFile'
import { groups } from './group'
import { repositories } from './repository'
import { users } from './user'

const activityTable = pgTable('Activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  allowLateSubmissions: boolean('allow_late_submissions').notNull().default(false),
  submissionType: activitySubmissionTypeEnum('submission_type').notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  deadlineRevision: integer('deadline_revision').notNull().default(1),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

const activityGroupTable = pgTable(
  'ActivityGroup',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activityTable.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ActivityGroup_activity_group_unique').on(table.activityId, table.groupId),
  ],
)

const activityAttachmentTable = pgTable(
  'ActivityAttachment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activityTable.id, { onDelete: 'restrict' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => bucketFiles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ActivityAttachment_activity_file_unique').on(table.activityId, table.fileId),
  ],
)

const activityViewTable = pgTable(
  'ActivityView',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activityTable.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('ActivityView_activity_user_unique').on(table.activityId, table.userId)],
)

const activitySubmissionTable = pgTable(
  'ActivitySubmission',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    activityId: uuid('activity_id')
      .notNull()
      .references(() => activityTable.id, { onDelete: 'restrict' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'restrict' }),
    submittedById: uuid('submitted_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    isLate: boolean('is_late').notNull().default(false),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('ActivitySubmission_activity_group_version_unique').on(
      table.activityId,
      table.groupId,
      table.version,
    ),
  ],
)

const activitySubmissionFileTable = pgTable(
  'ActivitySubmissionFile',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => activitySubmissionTable.id, { onDelete: 'restrict' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => bucketFiles.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ActivitySubmissionFile_submission_file_unique').on(
      table.submissionId,
      table.fileId,
    ),
  ],
)

const activitySubmissionLinkTable = pgTable(
  'ActivitySubmissionLink',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => activitySubmissionTable.id, { onDelete: 'restrict' }),
    repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'restrict' }),
    url: varchar('url', { length: 2048 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ActivitySubmissionLink_submission_url_unique').on(table.submissionId, table.url),
  ],
)

const activityEvaluationTable = pgTable(
  'ActivityEvaluation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    submissionId: uuid('submission_id')
      .notNull()
      .unique()
      .references(() => activitySubmissionTable.id, { onDelete: 'restrict' }),
    score: integer('score').notNull(),
    evaluatedById: uuid('evaluated_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [check('ActivityEvaluation_score_range', sql`${table.score} between 0 and 100`)],
)

export {
  activityAttachmentTable as activityAttachments,
  activityEvaluationTable as activityEvaluations,
  activityGroupTable as activityGroups,
  activitySubmissionFileTable as activitySubmissionFiles,
  activitySubmissionLinkTable as activitySubmissionLinks,
  activitySubmissionTable as activitySubmissions,
  activityTable as activities,
  activityViewTable as activityViews,
}

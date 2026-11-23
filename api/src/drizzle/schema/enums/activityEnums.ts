import { pgEnum } from 'drizzle-orm/pg-core'

export const ACTIVITY_SUBMISSION_TYPES = ['links', 'files', 'both'] as const
export type ActivitySubmissionType = (typeof ACTIVITY_SUBMISSION_TYPES)[number]
export const activitySubmissionTypeEnum = pgEnum(
  'activity_submission_type',
  ACTIVITY_SUBMISSION_TYPES,
)

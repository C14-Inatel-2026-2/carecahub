import type { ActivitySubmissionType } from '@/drizzle'

export type GetActivityDto = {
  id: string
  title: string
  description: string
  dueAt: Date
  allowLateSubmissions: boolean
  submissionType: ActivitySubmissionType
  createdById: string
  publishedAt: Date
  deadlineRevision: number
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  attachments: Array<{ id: string; filename: string; mimeType: string | null; size: number }>
  submission?: { id: string; submittedAt: Date; isLate: boolean } | null
}

import { z } from 'zod'
import type { Group } from './group'
import type { Project } from './project'

export type ActivitySubmissionType = 'links' | 'files' | 'both'

export type Attachment = {
  id: string
  filename: string
  mimeType: string | null
  size: number
}

export type ActivitySubmissionSummary = {
  id: string
  submittedAt: string
  isLate: boolean
}

export type Activity = {
  id: string
  title: string
  description: string
  dueAt: string
  allowLateSubmissions: boolean
  submissionType: ActivitySubmissionType
  createdById: string
  publishedAt: string
  deadlineRevision: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  attachments: Attachment[]
  submission?: ActivitySubmissionSummary | null
}

export type GroupRow = {
  group: Group
  project: Project | null
  viewers: string[]
  submission: {
    version: number
    submittedAt: string
    submittedBy: string
    isLate: boolean
    score: number | null
  } | null
}

export type ActivityPipeline = {
  metrics: { viewed: number; submitted: number; notViewed: number }
  columns: Record<'not_viewed' | 'viewed' | 'not_submitted' | 'submitted' | 'evaluated', GroupRow[]>
}

export type ActivityGroupDelivery = {
  group: Group
  project: Project | null
  viewers: Array<{ id: string; name: string }>
  submissions: ActivitySubmission[]
}

export type ActivitySubmission = {
  id: string
  groupId: string
  version: number
  isLate: boolean
  submittedAt: string
  score: number | null
  submittedBy: { id: string; name: string }
  links: Array<{ id: string; url: string; thumbnailUrl?: string }>
  files: Array<{ id: string; filename: string }>
}

export type ProjectActivityDelivery = {
  activityId: string
  title: string
  submissionId: string
  version: number
  isLate: boolean
  submittedAt: string
  score: number | null
}

export const activityFormSchema = z.object({
  title: z.string().trim().min(3, 'Informe um título com pelo menos 3 caracteres.').max(255),
  description: z.string().trim().min(1, 'Informe a descrição da atividade.').max(10_000),
  dueAt: z.string().min(1, 'Informe o prazo de entrega.'),
  allowLateSubmissions: z.boolean(),
  submissionType: z.enum(['links', 'files', 'both']),
  attachmentIds: z.array(z.string().uuid()).max(10),
})

export type ActivityFormRequest = z.infer<typeof activityFormSchema>

export const activitySubmissionSchema = z.object({
  fileIds: z.array(z.string().uuid()).max(10),
  repositoryIds: z.array(z.string().uuid()).max(20),
  additionalLinks: z.array(z.string().url('Informe um link válido.')).max(20),
})

export type ActivitySubmissionRequest = z.infer<typeof activitySubmissionSchema>

export const activityEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
})
export type ActivityEvaluationRequest = z.infer<typeof activityEvaluationSchema>

import { z } from 'zod'

export type Activity = {
  id: string
  title: string
  description: string
  dueDate: string
  allowLateSubmissions: boolean
  createdById: string
  isClosed: boolean
  createdAt?: string
  updatedAt?: string
}

export type Submission = {
  id: string
  activityId: string
  groupId: string
  submittedById: string
  url: string
  isLate: boolean
  submittedAt: string
  grade: number | null
  feedback: string | null
  gradedById: string | null
  gradedAt: string | null
}

export type GetActivityResponse = Activity

export type UpsertActivityRequest = {
  title: string
  description: string
  dueDate: string
  allowLateSubmissions: boolean
}

export type SubmitActivityRequest = { url: string }
export type GradeSubmissionRequest = { grade: number; feedback?: string }

export const activityFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(255, 'Use no máximo 255 caracteres.'),
  description: z.string().trim().min(1, 'Informe as instruções da atividade.'),
  dueDate: z
    .string()
    .min(1, 'Informe o prazo.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Informe uma data válida.'),
  allowLateSubmissions: z.boolean(),
})

export type ActivityFormValues = z.infer<typeof activityFormSchema>

export const submissionFormSchema = z.object({
  url: z.url('Informe o link da entrega (ex.: https://github.com/...).').max(500),
})

export type SubmissionFormValues = z.infer<typeof submissionFormSchema>

export const gradeFormSchema = z.object({
  grade: z
    .number({ error: 'Informe a nota.' })
    .min(0, 'A nota mínima é 0.')
    .max(10, 'A nota máxima é 10.'),
  feedback: z.string().max(2000, 'Use no máximo 2000 caracteres.').optional(),
})

export type GradeFormValues = z.infer<typeof gradeFormSchema>

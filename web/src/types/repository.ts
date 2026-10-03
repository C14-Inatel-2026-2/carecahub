import { z } from 'zod'
import type { User } from './user'

export const repositoryFormSchema = z.object({
  url: z
    .url('Informe uma URL válida.')
    .refine((value) => ['github.com', 'www.github.com'].includes(new URL(value).hostname), {
      message: 'Informe uma URL de repositório do GitHub.',
    }),
  ownerId: z.uuid('Selecione o responsável pelo repositório.'),
})

export type RepositoryFormValues = z.infer<typeof repositoryFormSchema>

export type Repository = {
  id: string
  url: string
  commitCount: number
  branchCount: number
  ownerId?: string
  projectId?: string
  owner?: User
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export type GetRepositoryResponse = Repository
export type CreateRepositoryRequest = {
  url: string
  ownerId: string
  projectId: string
}
export type UpdateRepositoryRequest = CreateRepositoryRequest

import { z } from 'zod'
import type { Project } from './project'
import type { User } from './user'

export const GROUP_TAGS = ['no_project', 'full', 'space_available'] as const
export type GroupTag = (typeof GROUP_TAGS)[number]

export const groupTagLabels: Record<GroupTag, string> = {
  no_project: 'SEM PROJETO',
  full: 'CHEIO',
  space_available: 'ESPAÇO DISPONÍVEL',
}

export type Group = {
  id: string
  friendlyId: string
  leaderId: string
  tags?: GroupTag[]
  project?: Project | null
  members: User[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type GetGroupResponse = Group
export const groupFormSchema = z.object({
  friendlyId: z
    .string()
    .trim()
    .min(1, 'Informe o nome do grupo.')
    .max(30, 'O nome deve ter no máximo 30 caracteres.'),
})
export type CreateGroupRequest = z.infer<typeof groupFormSchema>
export type PromoteLeaderRequest = { leaderId: string }

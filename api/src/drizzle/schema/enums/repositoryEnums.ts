import { pgEnum } from 'drizzle-orm/pg-core'

export const REPOSITORY_TYPES = ['monorepo', 'multirepo'] as const
export const REPOSITORY_TYPE = {
  monorepo: 'monorepo',
  multirepo: 'multirepo',
} as const
export type RepositoryType = (typeof REPOSITORY_TYPE)[keyof typeof REPOSITORY_TYPE]

export const repositoryTypeEnum = pgEnum('repository_type', REPOSITORY_TYPES)

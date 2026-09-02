import { pgEnum } from 'drizzle-orm/pg-core'

export const USER_ROLES = ['admin', 'teacher', 'mentor', 'student'] as const
export const USER_ROLE = {
  admin: 'admin',
  teacher: 'teacher',
  mentor: 'mentor',
  student: 'student',
} as const
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]
export const userRoleEnum = pgEnum('user_role', USER_ROLES)

export const USER_STATUSES = ['active', 'inactive', 'deleted'] as const
export const USER_STATUS = {
  active: 'active',
  inactive: 'inactive',
  deleted: 'deleted',
} as const
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]
export const userStatusEnum = pgEnum('user_status', USER_STATUSES)

import {
  bucketFiles,
  groupInvites,
  groups,
  notifications,
  projects,
  repositories,
  schema,
  systemParams,
  users,
} from './schema'

export type { GroupInviteStatus, NotificationType } from './schema/enums/notificationEnums'
export { GROUP_INVITE_STATUSES, NOTIFICATION_TYPES } from './schema/enums/notificationEnums'

export type { RepositoryType } from './schema/enums/repositoryEnums'
export {
  REPOSITORY_TYPE,
  REPOSITORY_TYPES,
} from './schema/enums/repositoryEnums'
export type { UserRole, UserStatus } from './schema/enums/userEnums'
export {
  USER_ROLE,
  USER_ROLES,
  USER_STATUS,
  USER_STATUSES,
} from './schema/enums/userEnums'
export {
  bucketFiles,
  groupInvites,
  groups,
  notifications,
  projects,
  repositories,
  schema,
  systemParams,
  users,
}

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type BucketFile = typeof bucketFiles.$inferSelect
export type NewBucketFile = typeof bucketFiles.$inferInsert
export type SysParam = typeof systemParams.$inferSelect
export type Repository = typeof repositories.$inferSelect
export type NewRepository = typeof repositories.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
export type GroupInvite = typeof groupInvites.$inferSelect
export type NewGroupInvite = typeof groupInvites.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

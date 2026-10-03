import {
  bucketFiles,
  groupInviteRelations,
  groupInvites,
  groups,
  notificationRelations,
  notifications,
  projects,
  repositories,
  repositoryRelations,
  systemParams,
  users,
} from './schema/entities'
import {
  groupInviteStatusEnum,
  notificationTypeEnum,
  repositoryTypeEnum,
  userRoleEnum,
  userStatusEnum,
} from './schema/enums'

export const schema = {
  users,
  bucketFiles,
  systemParams,
  repositories,
  projects,
  repositoryTypeEnum,
  userRoleEnum,
  userStatusEnum,
  repositoryRelations,
  groups,
  groupInvites,
  notifications,
  groupInviteRelations,
  notificationRelations,
  groupInviteStatusEnum,
  notificationTypeEnum,
}

export default schema
export {
  bucketFiles,
  groupInviteRelations,
  groupInviteStatusEnum,
  groupInvites,
  groups,
  notificationRelations,
  notifications,
  notificationTypeEnum,
  projects,
  repositories,
  repositoryRelations,
  repositoryTypeEnum,
  systemParams,
  userRoleEnum,
  userStatusEnum,
  users,
}

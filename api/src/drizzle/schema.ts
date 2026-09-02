import {
  bucketFiles,
  projects,
  repositories,
  repositoryRelations,
  systemParams,
  users,
} from './schema/entities'
import { repositoryTypeEnum, userRoleEnum, userStatusEnum } from './schema/enums'

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
}

export default schema
export {
  bucketFiles,
  projects,
  repositories,
  repositoryRelations,
  repositoryTypeEnum,
  systemParams,
  userRoleEnum,
  userStatusEnum,
  users,
}

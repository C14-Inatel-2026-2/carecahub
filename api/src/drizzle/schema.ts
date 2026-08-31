import {
  users,
  bucketFiles,
  systemParams,
  projects,
  repositories,
  repositoryRelations,
} from "./schema/entities";
import { userRoleEnum, userStatusEnum } from "./schema/enums";

export const schema = {
  users,
  bucketFiles,
  systemParams,
  repositories,
  projects,
  userRoleEnum,
  userStatusEnum,
  repositoryRelations,
};

export default schema;
export {
  users,
  bucketFiles,
  systemParams,
  repositories,
  projects,
  repositoryRelations,
  userRoleEnum,
  userStatusEnum,
};

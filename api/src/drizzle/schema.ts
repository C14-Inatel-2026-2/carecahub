import { users, bucketFiles, systemParams } from "./schema/entities";
import { userRoleEnum, userStatusEnum } from "./schema/enums";

export const schema = {
  users,
  bucketFiles,
  systemParams,
  userRoleEnum,
  userStatusEnum,
};

export default schema;
export { users, bucketFiles, systemParams, userRoleEnum, userStatusEnum };

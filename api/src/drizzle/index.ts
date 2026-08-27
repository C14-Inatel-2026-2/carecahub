import { User, schema, SystemParam, BucketFile } from "./schema";

export {
  USER_ROLE,
  USER_ROLES,
  USER_STATUS,
  USER_STATUSES,
} from "./schema/enums/userEnums";
export type { UserRole, UserStatus } from "./schema/enums/userEnums";
export { BucketFile, schema, SystemParam, User };

export type UserRecord = typeof User.$inferSelect;
export type NewUserRecord = typeof User.$inferInsert;
export type BucketFileRecord = typeof BucketFile.$inferSelect;
export type NewBucketFileRecord = typeof BucketFile.$inferInsert;
export type SysParamRecord = typeof SystemParam.$inferSelect;

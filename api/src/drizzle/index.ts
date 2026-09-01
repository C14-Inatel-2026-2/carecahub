import {
  users,
  schema,
  systemParams,
  bucketFiles,
  repositories,
  projects,
} from "./schema";

export {
  USER_ROLE,
  USER_ROLES,
  USER_STATUS,
  USER_STATUSES,
} from "./schema/enums/userEnums";
export type { UserRole, UserStatus } from "./schema/enums/userEnums";
export { bucketFiles, schema, systemParams, users, repositories, projects };

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BucketFile = typeof bucketFiles.$inferSelect;
export type NewBucketFile = typeof bucketFiles.$inferInsert;
export type SysParam = typeof systemParams.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

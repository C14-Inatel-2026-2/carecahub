import { Injectable } from "@nestjs/common";
import {
  GetUsersInGroupOutput,
  IGroupService,
  InsertGroupOutput,
  ListGroupOutput,
} from "./group.interface";
import { groups, UserRole } from "@db";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import { DrizzleService } from "@/providers/database/drizzle.service";
import { LoggerFactory } from "@/providers/logger/logger-factory.service";
import { ErrKeys, ServiceOutput, UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { isUniqueViolation } from "@/utils/query-violations";
import { GetGroupDto, GetGroupDtoRecord } from "./dto/get-group.dto";
import {
  groupPublicColumns,
  userPublicColumns,
  users,
} from "@/drizzle/schema/entities";
import { GetUserDto, GetUserDtoRecord } from "../users/dto/get-user.dto";

@Injectable()
export class GroupService implements IGroupService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(GroupService.name);
  }

  private isStudent(role: UserRole) {
    return role === "student";
  }

  private isGroupLeader(userId: string, groupLeaderId: string) {
    return userId === groupLeaderId;
  }

  async create(
    input: CreateGroupDto,
    requester: UserMetadata,
  ): Promise<InsertGroupOutput> {
    if (requester && !this.isStudent(requester.role)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [exists] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.friendlyId, input.friendlyId));

    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists };

    try {
      const [group] = await this.database.db
        .insert(groups)
        .values({
          friendlyId: input.friendlyId,
          leaderId: input.leaderId,
        })
        .returning(groupPublicColumns);

      return { ok: true, ...GetGroupDto.toDto(group as GetGroupDtoRecord) };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists };
      }
      this.logger.error(`Error trying to create new group: ${error}`);
      throw error;
    }
  }

  async findAll(
    query: QueryDto,
    requester?: UserMetadata,
  ): Promise<ListGroupOutput> {
    if (requester && !this.isStudent(requester.role)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const where = and(
      isNull(groups.deletedAt),
      query.search ? ilike(groups.friendlyId, `%${query.search}%`) : undefined,
    );

    try {
      const [groupRows, totalCount] = await Promise.all([
        this.database.db
          .select(groupPublicColumns)
          .from(groups)
          .where(where)
          .orderBy(asc(groups.friendlyId))
          .offset(query.skip)
          .limit(query.take),
        this.database.db.select({ count: count() }).from(groups).where(where),
      ]);
      return {
        ok: true,
        totalCount: Number(totalCount[0]?.count ?? 0),
        data: groupRows.map((group) => GetGroupDto.toDto(group)),
      };
    } catch (error) {
      this.logger.error(`Error trying to list groups: ${error}`);
      throw error;
    }
  }

  async findUsersInGroup(
    groupId: string,
    requester?: UserMetadata,
  ): Promise<GetUsersInGroupOutput> {
    if (requester && (!requester.groupId || requester.groupId !== groupId)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [exists] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, groupId));

    if (!exists) return { ok: false, errKey: ErrKeys.notFound };

    try {
      const [groupUsers, totalCount] = await Promise.all([
        this.database.db
          .select(userPublicColumns)
          .from(users)
          .where(eq(users.groupId, groupId)),
        this.database.db
          .select({ count: count() })
          .from(users)
          .where(eq(users.groupId, groupId)),
      ]);
      return {
        ok: true,
        data: groupUsers.map((user) => GetUserDto.toDto(user)),
        totalCount: Number(totalCount[0]?.count ?? 0),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async addUserToGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    if (requester && !this.isStudent(requester.role)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [userExists] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!userExists) return { ok: false, errKey: ErrKeys.notFound };

    const [groupExists] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, groupId));

    if (!groupExists) return { ok: false, errKey: ErrKeys.notFound };

    try {
      const [user] = await this.database.db
        .update(users)
        .set({ groupId: groupId })
        .where(eq(users.id, userId))
        .returning(userPublicColumns);

      if (!user) {
        return { ok: false, errKey: ErrKeys.notFound };
      }

      return { ok: true, ...GetUserDto.toDto(user as GetUserDtoRecord) };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async removeUserFromGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    if (requester && !this.isStudent(requester.role)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [groupExists] = await this.database.db
      .select({ id: groups.id, leaderId: groups.leaderId })
      .from(groups)
      .where(eq(groups.id, groupId));

    const [userExists] = await this.database.db
      .select({ id: users.id, userGroup: users.groupId })
      .from(users)
      .where(eq(users.id, userId));

    if (!groupExists) return { ok: false, errKey: ErrKeys.notFound };
    if (!userExists) return { ok: false, errKey: ErrKeys.notFound };

    const isLeader = this.isGroupLeader(requester.userId, groupExists.leaderId);
    const isSelf = requester.userId === userId;

    if (!isLeader && !isSelf) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    try {
      const [user] = await this.database.db
        .update(users)
        .set({ groupId: null })
        .where(and(eq(users.id, userId), eq(users.groupId, groupId)))
        .returning(userPublicColumns);

      if (!user) {
        return { ok: false, errKey: ErrKeys.notFound };
      }

      return { ok: true, ...GetUserDto.toDto(user as GetUserDtoRecord) };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async delete(
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    if (requester && !this.isStudent(requester.role)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [group] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));

    if (!group) return { ok: false, errKey: ErrKeys.notFound };

    try {
      await this.database.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({ deletedAt: new Date() })
          .where(eq(groups.id, groupId));

        await tx
          .update(users)
          .set({ groupId: null })
          .where(eq(users.groupId, groupId));
      });

      this.logger.log(`Group with id ${groupId} soft deleted.`);
      return { ok: true, ...GetGroupDto.toDto(group as GetGroupDtoRecord) };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}

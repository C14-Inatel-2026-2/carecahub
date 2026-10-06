import { groups, projects, repositories, users } from "@db";
import { Injectable } from "@nestjs/common";
import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { userPublicColumns } from "@/drizzle/schema/entities";
import { DrizzleService } from "@/providers/database/drizzle.service";
import { GitHubService } from "@/providers/github/github.service";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import { LoggerFactory } from "@/providers/logger/logger-factory.service";
import { ErrKeys, type ServiceOutput, type UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { ProjectService } from "../projects/project.service";
import { GetUserDto } from "../users/dto/get-user.dto";
import type { GetUserWithGitHubDetails } from "../users/user.interface";
import { CreateGroupDto } from "./dto/create-group.dto";
import type { GetGroupDtoRecord } from "./dto/get-group.dto";
import { GetGroupDto } from "./dto/get-group.dto";
import type {
  GetGroupOutput,
  GetUsersInGroupOutput,
  InsertGroupOutput,
  ListGroupOutput,
} from "./group.interface";
import { IGroupService } from "./group.interface";

@Injectable()
export class GroupService implements IGroupService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
    private readonly projectService: ProjectService,
    private readonly gitHubService: GitHubService,
  ) {
    this.logger = loggerFactory.create(GroupService.name);
  }

  async create(
    input: CreateGroupDto,
    requester: UserMetadata,
  ): Promise<InsertGroupOutput> {
    if (requester.role !== "student")
      return { ok: false, errKey: ErrKeys.forbidden };

    const [requesterUser] = await this.database.db
      .select({ id: users.id, groupId: users.groupId, status: users.status })
      .from(users)
      .where(and(eq(users.id, requester.userId), isNull(users.deletedAt)));
    if (!requesterUser) return { ok: false, errKey: ErrKeys.notFound };
    if (requesterUser.status !== "active")
      return { ok: false, errKey: ErrKeys.forbidden };
    if (requesterUser.groupId)
      return { ok: false, errKey: ErrKeys.alreadyExists };

    const [exists] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(
        and(eq(groups.friendlyId, input.friendlyId), isNull(groups.deletedAt)),
      );
    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists };

    try {
      const group = await this.database.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(groups)
          .values({ friendlyId: input.friendlyId, leaderId: requester.userId })
          .returning({
            id: groups.id,
            friendlyId: groups.friendlyId,
            leaderId: groups.leaderId,
            createdAt: groups.createdAt,
            updatedAt: groups.updatedAt,
            deletedAt: groups.deletedAt,
          });
        await tx
          .update(users)
          .set({ groupId: created.id })
          .where(eq(users.id, requester.userId));
        return created;
      });
      return { ok: true, ...GetGroupDto.toDto(group) };
    } catch (error) {
      if (this.isUniqueViolation(error))
        return { ok: false, errKey: ErrKeys.alreadyExists };
      this.logger.error(`Error trying to create new group: ${error}`);
      throw error;
    }
  }

  async findAll(
    query: QueryDto,
    _requester?: UserMetadata,
  ): Promise<ListGroupOutput> {
    const where = and(isNull(groups.deletedAt), this.searchFilter(query));
    const [groupRows, totalCount] = await Promise.all([
      this.database.db
        .select({
          id: groups.id,
          friendlyId: groups.friendlyId,
          leaderId: groups.leaderId,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
          deletedAt: groups.deletedAt,
        })
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
      data: await Promise.all(groupRows.map((group) => this.aggregate(group))),
    };
  }

  async findOne(
    groupId: string,
    requester?: UserMetadata,
  ): Promise<GetGroupOutput> {
    if (requester && !(await this.canReadGroup(groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };
    return { ok: true, ...(await this.aggregate(group)) };
  }

  async findUsersInGroup(
    groupId: string,
    requester?: UserMetadata,
  ): Promise<GetUsersInGroupOutput> {
    if (requester && !(await this.canReadGroup(groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    if (!(await this.findGroup(groupId)))
      return { ok: false, errKey: ErrKeys.notFound };
    const members = await this.findMembers(groupId);
    return { ok: true, totalCount: members.length, data: members };
  }

  async addUserToGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };
    if (!this.canManageGroup(group, requester)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    const [user] = await this.database.db
      .select({ id: users.id, groupId: users.groupId, status: users.status })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));
    if (!user) return { ok: false, errKey: ErrKeys.notFound };
    if (
      user.status !== "active" ||
      (user.groupId && user.groupId !== groupId)
    ) {
      return { ok: false, errKey: ErrKeys.invalidPayload };
    }
    if (user.groupId === groupId)
      return { ok: false, errKey: ErrKeys.alreadyExists };

    const [memberCount] = await this.database.db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.groupId, groupId),
          eq(users.status, "active"),
          isNull(users.deletedAt),
        ),
      );
    if (Number(memberCount?.count ?? 0) >= 6) {
      return { ok: false, errKey: ErrKeys.limitReached };
    }

    const [updated] = await this.database.db
      .update(users)
      .set({ groupId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(userPublicColumns);
    return { ok: true, ...GetUserDto.toDto(updated) };
  }

  async removeUserFromGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };
    if (!this.canManageGroup(group, requester)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    if (group.leaderId === userId)
      return { ok: false, errKey: ErrKeys.resourceInUse };

    const [updated] = await this.database.db
      .update(users)
      .set({ groupId: null, updatedAt: new Date() })
      .where(
        and(
          eq(users.id, userId),
          eq(users.groupId, groupId),
          isNull(users.deletedAt),
        ),
      )
      .returning(userPublicColumns);
    if (!updated) return { ok: false, errKey: ErrKeys.notFound };
    return { ok: true, ...GetUserDto.toDto(updated) };
  }

  async leave(
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    if (requester.role !== "student") {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };

    return this.database.db.transaction(async (tx) => {
      const members = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.groupId, groupId),
            eq(users.status, "active"),
            isNull(users.deletedAt),
          ),
        )
        .orderBy(asc(users.id));
      if (!members.some((member) => member.id === requester.userId)) {
        return { ok: false, errKey: ErrKeys.forbidden };
      }

      const remainingMembers = members.filter(
        (member) => member.id !== requester.userId,
      );
      const now = new Date();

      if (remainingMembers.length === 0) {
        await tx
          .update(projects)
          .set({ deletedAt: now, updatedAt: now })
          .where(and(eq(projects.groupId, groupId), isNull(projects.deletedAt)));
        await tx
          .update(groups)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(groups.id, groupId));
      } else if (group.leaderId === requester.userId) {
        await tx
          .update(groups)
          .set({ leaderId: remainingMembers[0].id, updatedAt: now })
          .where(eq(groups.id, groupId));
      }

      await tx
        .update(users)
        .set({ groupId: null, updatedAt: now })
        .where(and(eq(users.id, requester.userId), eq(users.groupId, groupId)));

      return { ok: true };
    });
  }

  async promoteLeader(
    leaderId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<GetGroupOutput> {
    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };
    if (!this.canManageGroup(group, requester)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    const [member] = await this.database.db
      .select({ id: users.id, groupId: users.groupId, status: users.status })
      .from(users)
      .where(and(eq(users.id, leaderId), isNull(users.deletedAt)));
    if (!member || member.groupId !== groupId || member.status !== "active") {
      return { ok: false, errKey: ErrKeys.invalidPayload };
    }

    const updated = await this.database.db.transaction(async (tx) => {
      const [row] = await tx
        .update(groups)
        .set({ leaderId, updatedAt: new Date() })
        .where(eq(groups.id, groupId))
        .returning({
          id: groups.id,
          friendlyId: groups.friendlyId,
          leaderId: groups.leaderId,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
          deletedAt: groups.deletedAt,
        });
      return row;
    });
    return { ok: true, ...GetGroupDto.toDto(updated) };
  }

  async delete(
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    const group = await this.findGroup(groupId);
    if (!group) return { ok: false, errKey: ErrKeys.notFound };
    if (!this.canManageGroup(group, requester)) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    const [project] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.groupId, groupId), isNull(projects.deletedAt)));
    if (project) return { ok: false, errKey: ErrKeys.resourceInUse };

    await this.database.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(groups.id, groupId));
      await tx
        .update(users)
        .set({ groupId: null, updatedAt: new Date() })
        .where(eq(users.groupId, groupId));
    });
    this.logger.log(`Group with id ${groupId} soft deleted.`);
    return { ok: true };
  }

  private async aggregate(group: GetGroupDtoRecord): Promise<GetGroupDto> {
    const [members, project] = await Promise.all([
      this.findMembers(group.id),
      this.projectService.findByGroupId(group.id),
    ]);
    return GetGroupDto.toDto(group, members, project);
  }

  private searchFilter(query: QueryDto) {
    if (!query.search) return undefined;

    const term = `%${query.search}%`;
    const memberMatches = sql`exists (
      select 1 from ${users}
      where ${users.groupId} = ${groups.id}
        and ${users.status} = 'active'
        and ${users.deletedAt} is null
        and ${users.name} ilike ${term}
    )`;

    if (query.searchScope !== "projects") {
      return or(ilike(groups.friendlyId, term), memberMatches);
    }

    const projectMatches = sql`exists (
      select 1 from ${projects}
      where ${projects.groupId} = ${groups.id}
        and ${projects.deletedAt} is null
        and (
          ${projects.projectName} ilike ${term}
          or exists (
            select 1 from ${repositories}
            where ${repositories.projectId} = ${projects.id}
              and ${repositories.deletedAt} is null
              and ${repositories.url} ilike ${term}
          )
        )
    )`;

    return or(memberMatches, projectMatches);
  }

  private async findMembers(
    groupId: string,
  ): Promise<GetUserWithGitHubDetails[]> {
    const rows = await this.database.db
      .select(userPublicColumns)
      .from(users)
      .where(
        and(
          eq(users.groupId, groupId),
          eq(users.status, "active"),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(asc(users.name));
    return Promise.all(
      rows.map(async (row) => {
        const user = GetUserDto.toDto(row);
        return {
          ...user,
          gitHubDetails: user.githubName
            ? await this.gitHubService.getUserDetails(user.githubName)
            : null,
        };
      }),
    );
  }

  private async findGroup(
    groupId: string,
  ): Promise<GetGroupDtoRecord | undefined> {
    const [group] = await this.database.db
      .select({
        id: groups.id,
        friendlyId: groups.friendlyId,
        leaderId: groups.leaderId,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        deletedAt: groups.deletedAt,
      })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    return group;
  }

  private canManageGroup(
    group: GetGroupDtoRecord,
    requester: UserMetadata,
  ): boolean {
    return requester.role === "admin" || group.leaderId === requester.userId;
  }

  private async findRequesterGroupId(
    userId: string,
  ): Promise<string | undefined> {
    const [user] = await this.database.db
      .select({ groupId: users.groupId })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.status, "active"),
          isNull(users.deletedAt),
        ),
      );
    return user?.groupId ?? undefined;
  }

  private async canReadGroup(
    groupId: string,
    requester: UserMetadata,
  ): Promise<boolean> {
    if (requester.role !== "student") return true;
    return (await this.findRequesterGroupId(requester.userId)) === groupId;
  }

  private isUniqueViolation(error: unknown): error is { code: "23505" } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}

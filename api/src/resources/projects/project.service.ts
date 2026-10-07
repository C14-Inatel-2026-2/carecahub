import { groups, projects, repositories, users } from "@db";
import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, isNull, ne } from "drizzle-orm";
import { DrizzleService } from "@/providers/database/drizzle.service";
import { GitHubService } from "@/providers/github/github.service";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import { LoggerFactory } from "@/providers/logger/logger-factory.service";
import { ErrKeys, type UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { GetUserDto } from "../users/dto/get-user.dto";
import type { GetUserWithGitHubDetails } from "../users/user.interface";
import type {
  GetProjectDtoRecord,
  ProjectRepositoryDto,
} from "./dto/get-project.dto";
import { GetProjectDto } from "./dto/get-project.dto";
import { UpsertProjectDto } from "./dto/upsert-project.dto";
import { UpdateProjectAppearanceDto } from "./dto/update-project-appearance.dto";
import type {
  GetProjectOutput,
  ListProjectOutput,
  RemoveProjectOutput,
  UpsertProjectOutput,
} from "./project.interface";
import { IProjectService } from "./project.interface";
import { userPublicColumns } from "@/drizzle/schema/entities";

@Injectable()
export class ProjectService implements IProjectService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly database: DrizzleService,
    private readonly gitHubService: GitHubService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(ProjectService.name);
  }

  async upsert(
    input: UpsertProjectDto,
    requester: UserMetadata,
  ): Promise<UpsertProjectOutput> {
    if (requester.role !== "admin" && requester.role !== "student") {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    try {
      return input.id
        ? await this.update({ ...input, id: input.id }, requester)
        : await this.create(input, requester);
    } catch (error) {
      if (this.isUniqueViolation(error))
        return { ok: false, errKey: ErrKeys.alreadyExists };
      throw error;
    }
  }

  private async create(
    input: UpsertProjectDto,
    requester: UserMetadata,
  ): Promise<UpsertProjectOutput> {
    const groupId = await this.resolveCreationGroup(input.groupId, requester);
    if (!groupId) {
      return {
        ok: false,
        errKey:
          requester.role === "admin"
            ? ErrKeys.invalidPayload
            : ErrKeys.forbidden,
      };
    }

    const [group] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)));
    if (!group) return { ok: false, errKey: ErrKeys.notFound };

    const [nameInUse] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.projectName, input.name), isNull(projects.deletedAt)),
      );
    if (nameInUse) return { ok: false, errKey: ErrKeys.alreadyExists };

    const [groupProject] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.groupId, groupId), isNull(projects.deletedAt)));
    if (groupProject) return { ok: false, errKey: ErrKeys.alreadyExists };

    const [created] = await this.database.db
      .insert(projects)
      .values(this.values(input, groupId))
      .returning({ id: projects.id });
    const project = await this.getRecord(created.id);
    if (!project) return { ok: false, errKey: ErrKeys.notFound };

    return { ok: true, ...(await this.withRepositoryStats(project)) };
  }

  private async update(
    input: UpsertProjectDto & { id: string },
    requester: UserMetadata,
  ): Promise<UpsertProjectOutput> {
    const current = await this.getRecord(input.id);
    if (!current) return { ok: false, errKey: ErrKeys.notFound };
    if (!(await this.canEditGroup(current.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    const [nameInUse] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.projectName, input.name),
          ne(projects.id, input.id),
          isNull(projects.deletedAt),
        ),
      );
    if (nameInUse) return { ok: false, errKey: ErrKeys.alreadyExists };

    await this.database.db
      .update(projects)
      .set({ ...this.values(input, current.groupId), updatedAt: new Date() })
      .where(eq(projects.id, input.id));
    const project = await this.getRecord(input.id);
    if (!project) return { ok: false, errKey: ErrKeys.notFound };

    return { ok: true, ...(await this.withRepositoryStats(project)) };
  }

  async findAll(
    query: QueryDto,
    requester?: UserMetadata,
  ): Promise<ListProjectOutput> {
    let groupId: string | undefined;
    if (requester?.role === "student") {
      groupId = await this.findRequesterGroupId(requester.userId);
      if (!groupId) return { ok: true, totalCount: 0, data: [] };
    }

    const where = and(
      isNull(projects.deletedAt),
      groupId ? eq(projects.groupId, groupId) : undefined,
      query.search
        ? ilike(projects.projectName, `%${query.search}%`)
        : undefined,
    );
    const [projectRows, totalCount] = await Promise.all([
      this.database.db
        .select(this.selection)
        .from(projects)
        .where(where)
        .orderBy(desc(projects.createdAt))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(projects).where(where),
    ]);

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: await Promise.all(
        projectRows.map((project) => this.withRepositoryStats(project)),
      ),
    };
  }

  async findOne(
    id: string,
    requester?: UserMetadata,
  ): Promise<GetProjectOutput> {
    const project = await this.getRecord(id);
    if (!project) return { ok: false, errKey: ErrKeys.notFound };
    if (requester && !(await this.canReadGroup(project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    return { ok: true, ...(await this.withRepositoryStats(project, true)) };
  }

  async findOneByName(
    projectName: string,
    requester?: UserMetadata,
  ): Promise<GetProjectOutput> {
    const project = await this.getRecordByName(projectName);
    if (!project) return { ok: false, errKey: ErrKeys.notFound };
    if (requester && !(await this.canReadGroup(project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }
    return { ok: true, ...(await this.withRepositoryStats(project, true)) };
  }

  async updateAppearance(
    id: string,
    input: UpdateProjectAppearanceDto,
    requester: UserMetadata,
  ): Promise<GetProjectOutput> {
    const project = await this.getRecord(id);
    if (!project) return { ok: false, errKey: ErrKeys.notFound };
    if (requester.role !== "student" || !(await this.canEditGroup(project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden };
    }

    await this.database.db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id));

    const updated = await this.getRecord(id);
    if (!updated) return { ok: false, errKey: ErrKeys.notFound };
    return { ok: true, ...(await this.withRepositoryStats(updated, true)) };
  }

  async findByGroupId(groupId: string): Promise<GetProjectDto | null> {
    const [project] = await this.database.db
      .select(this.selection)
      .from(projects)
      .where(and(eq(projects.groupId, groupId), isNull(projects.deletedAt)));
    return project ? this.withRepositoryStats(project) : null;
  }

  async remove(
    id: string,
    requester: UserMetadata,
  ): Promise<RemoveProjectOutput> {
    const [project] = await this.database.db
      .select({ id: projects.id, groupId: projects.groupId })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    if (!project) return { ok: false, errKey: ErrKeys.notFound };

    if (requester.role !== "admin") {
      const [group] = await this.database.db
        .select({ leaderId: groups.leaderId })
        .from(groups)
        .where(and(eq(groups.id, project.groupId), isNull(groups.deletedAt)));
      if (!group || group.leaderId !== requester.userId) {
        return { ok: false, errKey: ErrKeys.forbidden };
      }
    }

    await this.database.db
      .update(projects)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(projects.id, id));
    this.logger.log(`Project ${id} removed`);
    return { ok: true };
  }

  private values(input: UpsertProjectDto, groupId: string) {
    return {
      groupId,
      projectName: input.name,
      description: input.description,
      technologies: input.technologies,
      usesOtherTechnology: input.usesOtherTechnology,
      otherTechnology: this.optionalValue(input.otherTechnology),
      dependencyManager: input.dependencyManager,
      otherDependencyManager: this.optionalValue(input.otherDependencyManager),
      versionControl: input.versionControl,
      otherVersionControl: this.optionalValue(input.otherVersionControl),
      repositoryType: input.repositoryType,
    };
  }

  private optionalValue(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async resolveCreationGroup(
    requestedGroupId: string | undefined,
    requester: UserMetadata,
  ): Promise<string | undefined> {
    if (requester.role === "admin") return requestedGroupId;
    return this.findRequesterGroupId(requester.userId);
  }

  private async findRequesterGroupId(
    userId: string,
  ): Promise<string | undefined> {
    const [user] = await this.database.db
      .select({ groupId: users.groupId, status: users.status })
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

  private async canEditGroup(
    groupId: string,
    requester: UserMetadata,
  ): Promise<boolean> {
    if (requester.role === "admin") return true;
    if (requester.role !== "student") return false;
    const memberGroupId = await this.findRequesterGroupId(requester.userId);
    return memberGroupId === groupId;
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

  private readonly selection = {
    id: projects.id,
    groupId: projects.groupId,
    projectName: projects.projectName,
    description: projects.description,
    technologies: projects.technologies,
    usesOtherTechnology: projects.usesOtherTechnology,
    otherTechnology: projects.otherTechnology,
    dependencyManager: projects.dependencyManager,
    otherDependencyManager: projects.otherDependencyManager,
    versionControl: projects.versionControl,
    otherVersionControl: projects.otherVersionControl,
    repositoryType: projects.repositoryType,
    iconUrl: projects.iconUrl,
    thumbnailUrl: projects.thumbnailUrl,
    mainColor: projects.mainColor,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
    deletedAt: projects.deletedAt,
  };

  private async getRecord(
    id: string,
  ): Promise<GetProjectDtoRecord | undefined> {
    const [project] = await this.database.db
      .select(this.selection)
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)));
    return project;
  }

  private async getRecordByName(
    projectName: string,
  ): Promise<GetProjectDtoRecord | undefined> {
    const [project] = await this.database.db
      .select(this.selection)
      .from(projects)
      .where(
        and(
          eq(projects.projectName, projectName),
          isNull(projects.deletedAt),
        ),
      );
    return project;
  }

  private async withRepositoryStats(
    project: GetProjectDtoRecord,
    includeMembers = false,
  ): Promise<GetProjectDto> {
    const [repositoryRows, members] = await Promise.all([
      this.database.db
        .select({
          id: repositories.id,
          url: repositories.url,
          ownerId: repositories.ownerId,
          projectId: repositories.projectId,
          createdAt: repositories.createdAt,
          updatedAt: repositories.updatedAt,
        })
        .from(repositories)
        .where(
          and(
            eq(repositories.projectId, project.id),
            isNull(repositories.deletedAt),
          ),
        ),
      includeMembers ? this.findMembers(project.groupId) : undefined,
    ]);

    const projectRepositories: ProjectRepositoryDto[] = await Promise.all(
      repositoryRows.map(async (repository) => {
        const githubRepository = await this.gitHubService.getRepositoryFromUrl(
          repository.url,
        );
        return {
          ...repository,
          commitCount: githubRepository?.success
            ? githubRepository.commitCount
            : 0,
          branchCount: githubRepository?.success
            ? githubRepository.branches.length
            : 0,
        };
      }),
    );
    return GetProjectDto.toDto(project, projectRepositories, members);
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
}

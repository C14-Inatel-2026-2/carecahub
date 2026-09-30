import { groups, projects, repositories, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, isNull, ne } from 'drizzle-orm'
import { userPublicColumns } from '@/drizzle/schema/entities'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, type ServiceOutput, type UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import type { GetRepositoryDtoRecord } from './dto/get-repository.dto'
import { GetRepositoryDto } from './dto/get-repository.dto'
import { UpsertRepositoryDto } from './dto/upsert-repository.dto'
import type {
  GetRepositoryOutput,
  ListRepositoryOutput,
  UpsertRepositoryOutput,
} from './repository.interface'
import { IRepositoryService } from './repository.interface'

@Injectable()
export class RepositoryService implements IRepositoryService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    private readonly gitHubService: GitHubService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(RepositoryService.name)
  }

  async upsert(
    input: UpsertRepositoryDto,
    requester: UserMetadata,
  ): Promise<UpsertRepositoryOutput> {
    if (requester.role !== 'admin' && requester.role !== 'student') {
      return { ok: false, errKey: ErrKeys.forbidden }
    }
    try {
      return input.id
        ? await this.update({ ...input, id: input.id }, requester)
        : await this.create(input, requester)
    } catch (error) {
      if (this.isUniqueViolation(error)) return { ok: false, errKey: ErrKeys.alreadyExists }
      throw error
    }
  }

  private async create(
    input: UpsertRepositoryDto,
    requester: UserMetadata,
  ): Promise<UpsertRepositoryOutput> {
    const project = await this.findProject(input.projectId)
    if (!project) return { ok: false, errKey: ErrKeys.notFound }
    if (!(await this.canEditGroup(project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }
    if (!(await this.isValidOwner(input.ownerId, project.groupId))) {
      return { ok: false, errKey: ErrKeys.invalidPayload }
    }

    if (project.repositoryType === 'monorepo') {
      const [activeRepository] = await this.database.db
        .select({ id: repositories.id })
        .from(repositories)
        .where(and(eq(repositories.projectId, project.id), isNull(repositories.deletedAt)))
      if (activeRepository) return { ok: false, errKey: ErrKeys.resourceInUse }
    }

    const [urlInUse] = await this.database.db
      .select({ id: repositories.id })
      .from(repositories)
      .where(and(eq(repositories.url, input.url), isNull(repositories.deletedAt)))
    if (urlInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

    const [created] = await this.database.db
      .insert(repositories)
      .values({ url: input.url, ownerId: input.ownerId, projectId: input.projectId })
      .returning({ id: repositories.id })
    const repository = await this.getRecord(created.id)
    if (!repository) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetRepositoryDto.toDto(repository) }
  }

  private async update(
    input: UpsertRepositoryDto & { id: string },
    requester: UserMetadata,
  ): Promise<UpsertRepositoryOutput> {
    const current = await this.getRecord(input.id)
    if (!current) return { ok: false, errKey: ErrKeys.notFound }
    if (!(await this.canEditGroup(current.project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    const targetProject = await this.findProject(input.projectId)
    if (!targetProject) return { ok: false, errKey: ErrKeys.notFound }
    if (!(await this.canEditGroup(targetProject.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }
    if (!(await this.isValidOwner(input.ownerId, targetProject.groupId))) {
      return { ok: false, errKey: ErrKeys.invalidPayload }
    }

    if (targetProject.repositoryType === 'monorepo') {
      const [activeRepository] = await this.database.db
        .select({ id: repositories.id })
        .from(repositories)
        .where(
          and(
            eq(repositories.projectId, targetProject.id),
            ne(repositories.id, input.id),
            isNull(repositories.deletedAt),
          ),
        )
      if (activeRepository) return { ok: false, errKey: ErrKeys.resourceInUse }
    }

    const [urlInUse] = await this.database.db
      .select({ id: repositories.id })
      .from(repositories)
      .where(
        and(
          eq(repositories.url, input.url),
          ne(repositories.id, input.id),
          isNull(repositories.deletedAt),
        ),
      )
    if (urlInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

    await this.database.db
      .update(repositories)
      .set({
        url: input.url,
        ownerId: input.ownerId,
        projectId: input.projectId,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, input.id))
    const repository = await this.getRecord(input.id)
    if (!repository) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetRepositoryDto.toDto(repository) }
  }

  async findAll(query: QueryDto, requester?: UserMetadata): Promise<ListRepositoryOutput> {
    let groupId: string | undefined
    if (requester?.role === 'student') {
      groupId = await this.findRequesterGroupId(requester.userId)
      if (!groupId) return { ok: true, totalCount: 0, data: [] }
    }
    const where = and(
      isNull(repositories.deletedAt),
      isNull(projects.deletedAt),
      groupId ? eq(projects.groupId, groupId) : undefined,
      query.search ? ilike(repositories.url, `%${query.search}%`) : undefined,
    )
    const [rows, totalCount] = await Promise.all([
      this.database.db
        .select(this.selection)
        .from(repositories)
        .innerJoin(users, eq(repositories.ownerId, users.id))
        .innerJoin(projects, eq(repositories.projectId, projects.id))
        .where(where)
        .orderBy(desc(repositories.createdAt))
        .offset(query.skip)
        .limit(query.take),
      this.database.db
        .select({ count: count() })
        .from(repositories)
        .innerJoin(projects, eq(repositories.projectId, projects.id))
        .where(where),
    ])
    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: rows.map((repository) => GetRepositoryDto.toDto(repository)),
    }
  }

  async findOne(id: string, requester?: UserMetadata): Promise<GetRepositoryOutput> {
    const repository = await this.getRecord(id)
    if (!repository) return { ok: false, errKey: ErrKeys.notFound }
    if (requester && !(await this.canReadGroup(repository.project.groupId, requester))) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }
    const githubResult = await this.gitHubService.getRepositoryFromUrl(repository.url)
    if (!githubResult.success) return { ok: true, ...GetRepositoryDto.toDto(repository) }
    const { success: _success, ...details } = githubResult
    return { ok: true, ...GetRepositoryDto.toDto(repository, details) }
  }

  async remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>> {
    const [repository] = await this.database.db
      .select({ id: repositories.id, groupId: projects.groupId })
      .from(repositories)
      .innerJoin(projects, eq(repositories.projectId, projects.id))
      .where(and(eq(repositories.id, id), isNull(repositories.deletedAt)))
    if (!repository) return { ok: false, errKey: ErrKeys.notFound }

    if (requester.role !== 'admin') {
      const [group] = await this.database.db
        .select({ leaderId: groups.leaderId })
        .from(groups)
        .where(and(eq(groups.id, repository.groupId), isNull(groups.deletedAt)))
      if (!group || group.leaderId !== requester.userId) {
        return { ok: false, errKey: ErrKeys.forbidden }
      }
    }
    await this.database.db
      .update(repositories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(repositories.id, id))
    this.logger.log(`Repository ${id} removed`)
    return { ok: true }
  }

  private async findProject(id: string) {
    const [project] = await this.database.db
      .select({
        id: projects.id,
        groupId: projects.groupId,
        repositoryType: projects.repositoryType,
      })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    return project
  }

  private async isValidOwner(ownerId: string, groupId: string): Promise<boolean> {
    const [owner] = await this.database.db
      .select({ id: users.id, groupId: users.groupId, status: users.status })
      .from(users)
      .where(and(eq(users.id, ownerId), eq(users.status, 'active'), isNull(users.deletedAt)))
    return owner?.groupId === groupId
  }

  private async findRequesterGroupId(userId: string): Promise<string | undefined> {
    const [user] = await this.database.db
      .select({ groupId: users.groupId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.status, 'active'), isNull(users.deletedAt)))
    return user?.groupId ?? undefined
  }

  private async canEditGroup(groupId: string, requester: UserMetadata): Promise<boolean> {
    if (requester.role === 'admin') return true
    if (requester.role !== 'student') return false
    return (await this.findRequesterGroupId(requester.userId)) === groupId
  }

  private async canReadGroup(groupId: string, requester: UserMetadata): Promise<boolean> {
    if (requester.role !== 'student') return true
    return (await this.findRequesterGroupId(requester.userId)) === groupId
  }

  private isUniqueViolation(error: unknown): error is { code: '23505' } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }

  private readonly selection = {
    id: repositories.id,
    url: repositories.url,
    ownerId: repositories.ownerId,
    projectId: repositories.projectId,
    owner: userPublicColumns,
    project: {
      id: projects.id,
      groupId: projects.groupId,
      projectName: projects.projectName,
      repositoryType: projects.repositoryType,
    },
    createdAt: repositories.createdAt,
    updatedAt: repositories.updatedAt,
    deletedAt: repositories.deletedAt,
  }

  private async getRecord(id: string): Promise<GetRepositoryDtoRecord | undefined> {
    const [repository] = await this.database.db
      .select(this.selection)
      .from(repositories)
      .innerJoin(users, eq(repositories.ownerId, users.id))
      .innerJoin(projects, eq(repositories.projectId, projects.id))
      .where(
        and(eq(repositories.id, id), isNull(repositories.deletedAt), isNull(projects.deletedAt)),
      )
    return repository
  }
}

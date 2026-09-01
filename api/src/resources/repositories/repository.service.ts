import { projects, repositories, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, isNull, ne } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import type { GetRepositoryDtoRecord } from './dto/get-repository.dto'
import { GetRepositoryDto } from './dto/get-repository.dto'
import { UpsertRepositoryDto } from './dto/upsert-repository.dto'
import {
  GetRepositoryOutput,
  IRepositoryService,
  ListRepositoryOutput,
  UpsertRepositoryOutput,
} from './repository.interface'

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

  async upsert(input: UpsertRepositoryDto): Promise<UpsertRepositoryOutput> {
    try {
      return await this.persist(input)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists }
      }
      throw error
    }
  }

  private async persist(input: UpsertRepositoryDto): Promise<UpsertRepositoryOutput> {
    if (input.id) {
      const [repository] = await this.database.db
        .select({ id: repositories.id })
        .from(repositories)
        .where(and(eq(repositories.id, input.id), isNull(repositories.deleted_at)))

      if (!repository) return { ok: false, errKey: ErrKeys.notFound }

      const [urlInUse] = await this.database.db
        .select({ id: repositories.id })
        .from(repositories)
        .where(and(eq(repositories.url, input.url), ne(repositories.id, input.id)))

      if (urlInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

      await this.database.db
        .update(repositories)
        .set({
          url: input.url,
          ownerId: input.ownerId,
          projectId: input.projectId,
          updated_at: new Date(),
        })
        .where(eq(repositories.id, input.id))

      const updatedRepository = await this.getRecord(input.id)
      if (!updatedRepository) return { ok: false, errKey: ErrKeys.notFound }

      return { ok: true, ...GetRepositoryDto.toDto(updatedRepository) }
    }

    const [urlInUse] = await this.database.db
      .select({ id: repositories.id })
      .from(repositories)
      .where(eq(repositories.url, input.url))

    if (urlInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

    const [repository] = await this.database.db
      .insert(repositories)
      .values({
        url: input.url,
        ownerId: input.ownerId,
        projectId: input.projectId,
      })
      .returning({ id: repositories.id })

    const createdRepository = await this.getRecord(repository.id)
    if (!createdRepository) return { ok: false, errKey: ErrKeys.notFound }

    return { ok: true, ...GetRepositoryDto.toDto(createdRepository) }
  }

  private isUniqueViolation(error: unknown): error is { code: '23505' } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }

  async findAll(query: QueryDto, _requester?: UserMetadata): Promise<ListRepositoryOutput> {
    const where = query.search
      ? and(isNull(repositories.deleted_at), ilike(repositories.url, `%${query.search}%`))
      : isNull(repositories.deleted_at)

    const [repositoryRows, totalCount] = await Promise.all([
      this.database.db
        .select(this.selection)
        .from(repositories)
        .innerJoin(users, eq(repositories.ownerId, users.id))
        .innerJoin(projects, eq(repositories.projectId, projects.id))
        .where(where)
        .orderBy(desc(repositories.created_at))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(repositories).where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: repositoryRows.map((repository) => GetRepositoryDto.toDto(repository)),
    }
  }

  async findOne(id: string, _requester?: UserMetadata): Promise<GetRepositoryOutput> {
    const repository = await this.getRecord(id)
    if (!repository) return { ok: false, errKey: ErrKeys.notFound }

    const githubResult = await this.gitHubService.getRepositoryFromUrl(repository.url)
    if (!githubResult.success) {
      return { ok: true, ...GetRepositoryDto.toDto(repository, null) }
    }

    const { success: _success, ...details } = githubResult
    return { ok: true, ...GetRepositoryDto.toDto(repository, details) }
  }

  async remove(id: string, _requester: UserMetadata): Promise<ServiceOutput<object>> {
    const [repository] = await this.database.db
      .select({ id: repositories.id })
      .from(repositories)
      .where(and(eq(repositories.id, id), isNull(repositories.deleted_at)))

    if (!repository) return { ok: false, errKey: ErrKeys.notFound }

    await this.database.db
      .update(repositories)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(repositories.id, id))

    this.logger.log(`Repository ${id} removed`)
    return { ok: true }
  }

  private readonly selection = {
    id: repositories.id,
    url: repositories.url,
    owner: users,
    project: projects,
    created_at: repositories.created_at,
    updated_at: repositories.updated_at,
    deleted_at: repositories.deleted_at,
  }

  private async getRecord(id: string): Promise<GetRepositoryDtoRecord | undefined> {
    const [repository] = await this.database.db
      .select(this.selection)
      .from(repositories)
      .innerJoin(users, eq(repositories.ownerId, users.id))
      .innerJoin(projects, eq(repositories.projectId, projects.id))
      .where(and(eq(repositories.id, id), isNull(repositories.deleted_at)))

    return repository
  }
}

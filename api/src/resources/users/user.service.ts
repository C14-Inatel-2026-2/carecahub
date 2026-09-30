import { groups, USER_ROLES, type UserRole, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, asc, count, eq, ilike, inArray, isNull, or } from 'drizzle-orm'
import { userPublicColumns } from '@/drizzle/schema/entities'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { hashPassword } from '@/utils/password'
import { isUniqueViolation } from '@/utils/query-violations'
import type { GetUserDtoRecord, GetUserQueryDto } from './dto/get-user.dto'
import { GetUserDto } from './dto/get-user.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'
import {
  GetUserOutput,
  GetUserWithGitHubDetails,
  IUsersService,
  ListUserOutput,
  UpsertUserOutput,
} from './user.interface'

@Injectable()
export class UsersService implements IUsersService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
    private readonly gitHubService: GitHubService,
  ) {
    this.logger = loggerFactory.create(UsersService.name)
  }

  async register(input: CreateUserDto, requester: UserMetadata): Promise<UpsertUserOutput> {
    if (!this.canManage(requester)) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    const [exists] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists }

    try {
      const [user] = await this.database.db
        .insert(users)
        .values({
          name: input.name,
          registration: input.registration,
          githubName: input.githubName,
          classroom: input.classroom,
          email: input.email,
          password: await hashPassword(input.password),
          role: input.role,
        })
        .returning(userPublicColumns)

      return { ok: true, ...GetUserDto.toDto(user as GetUserDtoRecord) }
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists }
      }
      throw error
    }
  }

  async findAll(query: GetUserQueryDto, requester?: UserMetadata): Promise<ListUserOutput> {
    const allowedRoles = this.allowedTargetRoles(requester)
    if (allowedRoles.length === 0) {
      return { ok: true, totalCount: 0, data: [] }
    }

    if (query.roles && !query.roles.every((role) => allowedRoles.includes(role))) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    const roleScope = inArray(users.role, allowedRoles)

    const roleFilter = query.roles ? inArray(users.role, query.roles) : roleScope

    const where = and(
      isNull(users.deletedAt),
      roleFilter,
      query.search
        ? or(
            ilike(users.name, `%${query.search}%`),
            ilike(users.email, `%${query.search}%`),
            ilike(users.githubName, `%${query.search}%`),
          )
        : undefined,
    )
    const [userRows, totalCount] = await Promise.all([
      this.database.db
        .select(userPublicColumns)
        .from(users)
        .where(where)
        .orderBy(asc(users.name))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(users).where(where),
    ])

    const data = await Promise.all(
      userRows.map((user) => this.withGitHubDetails(GetUserDto.toDto(user))),
    )

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data,
    }
  }

  async findOne(id: string, requester?: UserMetadata): Promise<GetUserOutput> {
    const [user] = await this.database.db
      .select(userPublicColumns)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
    if (!user) return { ok: false, errKey: ErrKeys.notFound }
    if (requester?.userId !== user.id && !this.canRead(requester, user.role)) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    return {
      ok: true,
      ...(await this.withGitHubDetails(GetUserDto.toDto(user))),
    }
  }

  async update(
    id: string,
    input: UpdateUserDto,
    _requester: UserMetadata,
  ): Promise<UpsertUserOutput> {
    const [user] = await this.database.db
      .select(userPublicColumns)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
    if (!user) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(_requester)) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    if (input.email && input.email !== user.email) {
      const [emailInUse] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
      if (emailInUse) return { ok: false, errKey: ErrKeys.alreadyExists }
    }

    let updatedUser: GetUserDtoRecord
    try {
      ;[updatedUser] = await this.database.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning(userPublicColumns)
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists }
      }
      throw error
    }

    return { ok: true, ...GetUserDto.toDto(updatedUser) }
  }

  async remove(id: string, _requester: UserMetadata): Promise<ServiceOutput<object>> {
    const [user] = await this.database.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
    if (!user) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(_requester)) {
      return { ok: false, errKey: ErrKeys.forbidden }
    }

    const [ledGroup] = await this.database.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.leaderId, id), isNull(groups.deletedAt)))
    if (ledGroup) return { ok: false, errKey: ErrKeys.resourceInUse }

    await this.database.db
      .update(users)
      .set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))

    this.logger.log(`User with id ${id} soft deleted.`)
    return { ok: true, ...GetUserDto.toDto(user as GetUserDtoRecord) }
  }

  private allowedTargetRoles(requester?: UserMetadata): UserRole[] {
    if (requester?.role === 'admin') return [...USER_ROLES]
    if (requester?.role === 'teacher') return ['mentor', 'student']
    if (requester?.role === 'mentor') return ['student']
    return []
  }

  private canRead(requester: UserMetadata | undefined, targetRole: UserRole): boolean {
    return this.allowedTargetRoles(requester).includes(targetRole)
  }

  private canManage(requester: UserMetadata | undefined): boolean {
    return requester?.role === 'admin'
  }

  private async withGitHubDetails(user: GetUserDto): Promise<GetUserWithGitHubDetails> {
    if (!user.githubName) {
      return { ...user, gitHubDetails: null }
    }

    return {
      ...user,
      gitHubDetails: await this.gitHubService.getUserDetails(user.githubName),
    }
  }
}

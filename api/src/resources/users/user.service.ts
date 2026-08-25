import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { hashPassword } from '@/utils/password'
import { GetUserDto } from './dto/get-user.dto'
import type { GetUserDtoRecord } from './dto/get-user.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'
import { GetUserOutput, IUsersService, ListUserOutput, UpsertUserOutput } from './user.interface'

@Injectable()
export class UsersService implements IUsersService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(UsersService.name)
  }

  async register(input: CreateUserDto): Promise<UpsertUserOutput> {
    const [exists] = await this.database.users
      .select({ id: this.database.users.table.id })
      .where(eq(this.database.users.table.email, input.email))
    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists }

    const [user] = await this.database.users
      .insert({
        name: input.name,
        email: input.email,
        password: await hashPassword(input.password),
        role: 'user',
      })
      .returning()

    return { ok: true, ...GetUserDto.toDto(user as GetUserDtoRecord) }
  }

  async findAll(query: QueryDto, _requester?: UserMetadata): Promise<ListUserOutput> {
    const where = query.search
      ? and(
          isNull(this.database.users.table.deleted_at),
          or(
            ilike(this.database.users.table.name, `%${query.search}%`),
            ilike(this.database.users.table.email, `%${query.search}%`),
          ),
        )
      : isNull(this.database.users.table.deleted_at)
    const [users, totalCount] = await Promise.all([
      this.database.users
        .select(this.database.users.publicColumns)
        .where(where)
        .orderBy(desc(this.database.users.table.created_at))
        .offset(query.skip)
        .limit(query.take),
      this.database.db
        .select({ count: count() })
        .from(this.database.users.table)
        .where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: users.map((user) => GetUserDto.toDto(user as GetUserDtoRecord)),
    }
  }

  async findOne(id: string, _requester?: UserMetadata): Promise<GetUserOutput> {
    const [user] = await this.database.users
      .select(this.database.users.publicColumns)
      .where(
        and(eq(this.database.users.table.id, id), isNull(this.database.users.table.deleted_at)),
      )
    if (!user) return { ok: false, errKey: ErrKeys.notFound }
    return {
      ok: true,
      ...GetUserDto.toDto(user as GetUserDtoRecord),
    }
  }

  async update(
    id: string,
    input: UpdateUserDto,
    _requester: UserMetadata,
  ): Promise<UpsertUserOutput> {
    const [user] = await this.database.users
      .select(this.database.users.publicColumns)
      .where(
        and(eq(this.database.users.table.id, id), isNull(this.database.users.table.deleted_at)),
      )
    if (!user) return { ok: false, errKey: ErrKeys.notFound }

    if (input.email && input.email !== user.email) {
      const [emailInUse] = await this.database.users
        .select({ id: this.database.users.table.id })
        .where(eq(this.database.users.table.email, input.email))
      if (emailInUse) return { ok: false, errKey: ErrKeys.alreadyExists }
    }

    const [updatedUser] = await this.database.users
      .update()
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where(eq(this.database.users.table.id, id))
      .returning()
    return {
      ok: true,
      ...GetUserDto.toDto(updatedUser as GetUserDtoRecord),
    }
  }

  async remove(id: string, _requester: UserMetadata): Promise<ServiceOutput<object>> {
    const [user] = await this.database.users
      .select({ id: this.database.users.table.id })
      .where(
        and(eq(this.database.users.table.id, id), isNull(this.database.users.table.deleted_at)),
      )
    if (!user) return { ok: false, errKey: ErrKeys.notFound }

    await this.database.users
      .update()
      .set({
        status: 'deleted',
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(this.database.users.table.id, id))
    this.logger.log(`User ${id} removed`)
    return { ok: true }
  }
}

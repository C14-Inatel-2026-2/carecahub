import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/providers/database/prisma.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { hashPassword } from '@/utils/password'
import { GetUserDto } from './dto/get-user.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'
import { GetUserOutput, IUsersService, ListUserOutput, UpsertUserOutput } from './user.interface'

@Injectable()
export class UsersService implements IUsersService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: PrismaService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(UsersService.name)
  }

  async register(input: CreateUserDto): Promise<UpsertUserOutput> {
    const exists = await this.database.users.findUnique({ where: { email: input.email } })
    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists }

    const user = await this.database.users.create({
      data: {
        name: input.name,
        email: input.email,
        password: await hashPassword(input.password),
        role: 'user',
      },
    })

    return { ok: true, ...GetUserDto.toDto(user) }
  }

  async findAll(query: QueryDto, _requester?: UserMetadata): Promise<ListUserOutput> {
    const where = query.search
      ? {
          deleted_at: null,
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : { deleted_at: null }
    const [users, totalCount] = await Promise.all([
      this.database.users.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { created_at: 'desc' },
      }),
      this.database.users.count({ where }),
    ])

    return {
      ok: true,
      totalCount,
      data: users.map((user) => GetUserDto.toDto(user)),
    }
  }

  async findOne(id: string, _requester?: UserMetadata): Promise<GetUserOutput> {
    const user = await this.database.users.findFirst({ where: { id, deleted_at: null } })
    if (!user) return { ok: false, errKey: ErrKeys.notFound }
    return {
      ok: true,
      ...GetUserDto.toDto(user),
    }
  }

  async update(
    id: string,
    input: UpdateUserDto,
    _requester: UserMetadata,
  ): Promise<UpsertUserOutput> {
    const user = await this.database.users.findFirst({ where: { id, deleted_at: null } })
    if (!user) return { ok: false, errKey: ErrKeys.notFound }

    if (input.email && input.email !== user.email) {
      const emailInUse = await this.database.users.findUnique({ where: { email: input.email } })
      if (emailInUse) return { ok: false, errKey: ErrKeys.alreadyExists }
    }

    const updatedUser = await this.database.users.update({ where: { id }, data: input })
    return {
      ok: true,
      ...GetUserDto.toDto(updatedUser),
    }
  }

  async remove(id: string, _requester: UserMetadata): Promise<ServiceOutput<object>> {
    const user = await this.database.users.findFirst({ where: { id, deleted_at: null } })
    if (!user) return { ok: false, errKey: ErrKeys.notFound }

    await this.database.users.update({
      where: { id },
      data: { status: 'deleted', deleted_at: new Date() },
    })
    this.logger.log(`User ${id} removed`)
    return { ok: true }
  }
}

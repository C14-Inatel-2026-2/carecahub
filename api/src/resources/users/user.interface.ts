import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetUserDto } from './dto/get-user.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'

export type UpsertUserOutput = ServiceOutput<GetUserDto>

export type GetUserOutput = ServiceOutput<GetUserDto>
export type ListUserOutput = ServiceOutput<List<GetUserDto>>

export abstract class IUsersService {
  abstract register(input: CreateUserDto): Promise<UpsertUserOutput>
  abstract findAll(query: QueryDto, requester?: UserMetadata): Promise<ListUserOutput>
  abstract findOne(id: string, requester?: UserMetadata): Promise<GetUserOutput>
  abstract update(
    id: string,
    input: UpdateUserDto,
    requester: UserMetadata,
  ): Promise<UpsertUserOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>>
}

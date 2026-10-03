import type { GitHubUserDetails } from '@/providers/github/github.types'
import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetUserDto } from './dto/get-user.dto'
import { GetUserAnalyticsDto } from './dto/get-user-analytics.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'

export type UpsertUserOutput = ServiceOutput<GetUserDto>

export type GetUserWithGitHubDetails = GetUserDto & {
  gitHubDetails: GitHubUserDetails | null
}

export type GetUserOutput = ServiceOutput<GetUserWithGitHubDetails>
export type ListUserOutput = ServiceOutput<List<GetUserWithGitHubDetails>>
export type UserAnalyticsOutput = ServiceOutput<GetUserAnalyticsDto>

export abstract class IUsersService {
  abstract register(input: CreateUserDto, requester: UserMetadata): Promise<UpsertUserOutput>
  abstract findAll(query: QueryDto, requester?: UserMetadata): Promise<ListUserOutput>
  abstract findOne(id: string, requester?: UserMetadata): Promise<GetUserOutput>
  abstract update(
    id: string,
    input: UpdateUserDto,
    requester: UserMetadata,
  ): Promise<UpsertUserOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>>
  abstract getAnalytics(requester: UserMetadata): Promise<UserAnalyticsOutput>
}

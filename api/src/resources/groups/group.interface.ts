import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetUserDto } from '../users/dto/get-user.dto'
import { CreateGroupDto } from './dto/create-group.dto'
import { GetGroupDto } from './dto/get-group.dto'

export type InsertGroupOutput = ServiceOutput<GetGroupDto>
export type ListGroupOutput = ServiceOutput<List<GetGroupDto>>
export type GetGroupOutput = ServiceOutput<GetGroupDto>
export type GetUsersInGroupOutput = ServiceOutput<List<GetUserDto>>

export abstract class IGroupService {
  abstract create(input: CreateGroupDto, requester: UserMetadata): Promise<InsertGroupOutput>
  abstract findAll(query: QueryDto, requester?: UserMetadata): Promise<ListGroupOutput>
  abstract findOne(groupId: string, requester?: UserMetadata): Promise<GetGroupOutput>
  abstract findUsersInGroup(
    groupId: string,
    requester?: UserMetadata,
  ): Promise<GetUsersInGroupOutput>
  abstract addUserToGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>>
  abstract removeUserFromGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>>
  abstract promoteLeader(
    leaderId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<GetGroupOutput>
  abstract delete(groupId: string, requester: UserMetadata): Promise<ServiceOutput<object>>
}

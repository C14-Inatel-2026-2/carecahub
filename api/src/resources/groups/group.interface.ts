import { ServiceOutput, UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { List } from "@/utils/dtos/base.dto";
import { GetGroupDto } from "./dto/get-group.dto";
import { GetUserDto } from "../users/dto/get-user.dto";

export type InsertGroupOutput = ServiceOutput<GetGroupDto>;
export type ListGroupOutput = ServiceOutput<List<GetGroupDto>>;
export type GetGroupOutput = ServiceOutput<GetGroupDto>;
export type GetUsersInGroupOutput = ServiceOutput<List<GetUserDto>>;

export abstract class IGroupService {
  abstract create(
    input: CreateGroupDto,
    requester: UserMetadata,
  ): Promise<InsertGroupOutput>;
  abstract findAll(
    query: QueryDto,
    requester?: UserMetadata,
  ): Promise<ListGroupOutput>;
  abstract findUsersInGroup(
    groupId: string,
    requester?: UserMetadata,
  ): Promise<GetUsersInGroupOutput>;
  abstract addUserToGroup(
    userId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>>;
  abstract remove(
    groupId: string,
    requester: UserMetadata,
  ): Promise<ServiceOutput<object>>;
}

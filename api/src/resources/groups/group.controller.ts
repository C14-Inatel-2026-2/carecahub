import { Body, Delete, Get, Patch, Post, Query } from "@nestjs/common";
import { ApiController } from "@/infra/controller.decorator";
import { Roles } from "@/infra/roles.guard";
import { User } from "@/infra/user.decorator";
import { UUIDParam } from "@/infra/uuid-param.decorator";
import { UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { CreateGroupDto } from "./dto/create-group.dto";
import { GroupMemberDto, PromoteLeaderDto } from "./dto/group-member.dto";
import { GroupService } from "./group.service";

@ApiController("groups", "Groups")
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles(["student"])
  create(@User() requester: UserMetadata, @Body() body: CreateGroupDto) {
    return this.groupService.create(body, requester);
  }

  @Get()
  @Roles(["admin", "teacher", "mentor"])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.groupService.findAll(query, requester);
  }

  @Get(":id")
  @Roles(["admin", "teacher", "mentor", "student"])
  findOne(@User() requester: UserMetadata, @UUIDParam() groupId: string) {
    return this.groupService.findOne(groupId, requester);
  }

  @Get(":id/users")
  @Roles(["admin", "teacher", "mentor", "student"])
  findUsersInGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
  ) {
    return this.groupService.findUsersInGroup(groupId, requester);
  }

  @Post(":id/users")
  @Roles(["admin", "student"])
  addUserToGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
    @Body() body: GroupMemberDto,
  ) {
    return this.groupService.addUserToGroup(body.userId, groupId, requester);
  }

  @Patch(":id/leader")
  @Roles(["admin", "student"])
  promoteLeader(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
    @Body() body: PromoteLeaderDto,
  ) {
    return this.groupService.promoteLeader(body.leaderId, groupId, requester);
  }

  @Delete(":id/users/:userId")
  @Roles(["admin", "student"])
  removeUserFromGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
    @UUIDParam("userId") userId: string,
  ) {
    return this.groupService.removeUserFromGroup(userId, groupId, requester);
  }

  @Delete(":id/leave")
  @Roles(["student"])
  leave(@User() requester: UserMetadata, @UUIDParam() groupId: string) {
    return this.groupService.leave(groupId, requester);
  }

  @Delete(":id")
  @Roles(["admin", "student"])
  delete(@User() requester: UserMetadata, @UUIDParam() groupId: string) {
    return this.groupService.delete(groupId, requester);
  }
}

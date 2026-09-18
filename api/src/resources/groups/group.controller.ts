import { ApiController } from "@/infra/controller.decorator";
import { GroupService } from "./group.service";
import { Body, Delete, Get, Patch, Post, Query } from "@nestjs/common";
import { Roles } from "@/infra/roles.guard";
import { User } from "@/infra/user.decorator";
import { UserMetadata } from "@/types";
import { CreateGroupDto } from "./dto/create-group.dto";
import { QueryDto } from "@/utils/dtos/query.dto";
import { UUIDParam } from "@/infra/uuid-param.decorator";

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
  findUsersInGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
  ) {
    return this.groupService.findUsersInGroup(groupId, requester);
  }

  @Patch(":id")
  @Roles(["student"])
  addUserToGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
    @Body() userId: string,
  ) {
    return this.groupService.addUserToGroup(userId, groupId, requester);
  }

  @Delete(":id/users/:userId")
  @Roles(["student"])
  removeUserFromGroup(
    @User() requester: UserMetadata,
    @UUIDParam() groupId: string,
    @UUIDParam("userId") userId: string,
  ) {
    return this.groupService.removeUserFromGroup(userId, groupId, requester);
  }

  @Delete(":id")
  @Roles(["student"])
  delete(@User() requester: UserMetadata, @UUIDParam() groupId: string) {
    return this.groupService.delete(groupId, requester);
  }
}

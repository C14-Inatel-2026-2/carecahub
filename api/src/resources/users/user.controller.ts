import { Body, Delete, Get, Patch, Post, Query } from "@nestjs/common";
import { ApiController } from "@/infra/controller.decorator";
import { Roles } from "@/infra/roles.guard";
import { User } from "@/infra/user.decorator";
import { UUIDParam } from "@/infra/uuid-param.decorator";
import { UserMetadata } from "@/types";
import { GetUserQueryDto } from "./dto/get-user.dto";
import { CreateUserDto, UpdateUserDto } from "./dto/upsert-user.dto";
import { UsersService } from "./user.service";

@ApiController("users", "Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(["admin"])
  register(@User() requester: UserMetadata, @Body() body: CreateUserDto) {
    return this.usersService.register(body, requester);
  }

  @Get()
  @Roles(["admin", "teacher", "mentor", "student"])
  findAll(@User() requester: UserMetadata, @Query() query: GetUserQueryDto) {
    return this.usersService.findAll(query, requester);
  }

  @Get(":id")
  @Roles(["admin", "teacher", "mentor", "student"])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.findOne(id, requester);
  }

  @Patch(":id")
  @Roles(["admin"])
  update(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body, requester);
  }

  @Delete(":id")
  @Roles(["admin"])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.remove(id, requester);
  }
}

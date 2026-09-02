import { Body, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'
import { UsersService } from './user.service'

@ApiController('users', 'Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(['admin', 'teacher', 'mentor'])
  register(@User() requester: UserMetadata, @Body() body: CreateUserDto) {
    return this.usersService.register(body, requester)
  }

  @Get()
  @Roles(['admin', 'teacher', 'mentor'])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.usersService.findAll(query, requester)
  }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.findOne(id, requester)
  }

  @Patch(':id')
  @Roles(['admin', 'teacher', 'mentor'])
  update(@User() requester: UserMetadata, @UUIDParam() id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body, requester)
  }

  @Delete(':id')
  @Roles(['admin', 'teacher', 'mentor'])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.remove(id, requester)
  }
}

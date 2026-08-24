import { Body, Delete, Get, Patch, Post, Query, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiController } from '@/infra/controller.decorator'
import { Public } from '@/infra/public.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { AuthService } from '../auth/auth.service'
import { CreateUserDto, UpdateUserDto } from './dto/upsert-user.dto'
import { UsersService } from './user.service'

@ApiController('users', 'Users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Public()
  async register(
    @Res({ passthrough: true }) response: Response,
    @Body() body: CreateUserDto,
    @Req() _request: Request,
    @User() requester: UserMetadata,
  ) {
    const user = await this.usersService.register(body)

    if (!user.ok) {
      return user
    }

    if (!requester) {
      const jwtPayload: UserMetadata = {
        userId: user.id,
        name: user.name,
        role: user.role,
      }

      const { accessToken, refreshToken } = await this.authService.prepareNewTokens(
        user.id,
        jwtPayload,
      )
      this.authService.setResponseWithTokens(response, { accessToken, refreshToken })
    }

    return user
  }

  @Get()
  @Roles(['admin'])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.usersService.findAll(query, requester)
  }

  @Get(':id')
  @Roles(['admin'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.findOne(id, requester)
  }

  @Patch(':id')
  @Roles(['admin'])
  update(@User() requester: UserMetadata, @UUIDParam() id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body, requester)
  }

  @Delete(':id')
  @Roles(['admin'])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.usersService.remove(id, requester)
  }
}

import { Body, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { UpsertRepositoryDto } from './dto/upsert-repository.dto'
import { RepositoryService } from './repository.service'

@ApiController('repositories', 'Repositories')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Post()
  @Roles(['admin', 'student'])
  create(@User() requester: UserMetadata, @Body() body: UpsertRepositoryDto) {
    return this.repositoryService.upsert(body, requester)
  }

  @Patch(':id')
  @Roles(['admin', 'student'])
  update(
    @User() requester: UserMetadata,
    @UUIDParam() id: string,
    @Body() body: UpsertRepositoryDto,
  ) {
    return this.repositoryService.upsert({ ...body, id }, requester)
  }

  @Get()
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.repositoryService.findAll(query, requester)
  }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.repositoryService.findOne(id, requester)
  }

  @Delete(':id')
  @Roles(['admin', 'student'])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.repositoryService.remove(id, requester)
  }
}

import { Body, Get, Post, Query } from '@nestjs/common'
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
  upsert(@Body() body: UpsertRepositoryDto) {
    return this.repositoryService.upsert(body)
  }

  @Get()
  @Roles(['admin'])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.repositoryService.findAll(query, requester)
  }

  @Get(':id')
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.repositoryService.findOne(id, requester)
  }
}

import { Body, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { CreatePostDto, UpdatePostDto } from './dto/upsert-post.dto'
import { PostsService } from './post.service'

@ApiController('posts', 'Posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() body: CreatePostDto, @User() requester: UserMetadata) {
    return this.postsService.create(body, requester)
  }

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.postsService.findAll(query)
  }

  @Get(':id')
  findOne(@UUIDParam() id: string) {
    return this.postsService.findOne(id)
  }

  @Patch(':id')
  update(@UUIDParam() id: string, @Body() body: UpdatePostDto, @User() requester: UserMetadata) {
    return this.postsService.update(id, body, requester)
  }

  @Delete(':id')
  remove(@UUIDParam() id: string, @User() requester: UserMetadata) {
    return this.postsService.remove(id, requester)
  }
}

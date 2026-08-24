import { ApiProperty } from '@nestjs/swagger'
import { posts, users } from '@/providers/database/generated/prisma/client'
import { BaseDto } from '@/utils/dtos/base.dto'

type PostWithAuthor = posts & { author: users }

export class GetPostDto extends BaseDto<GetPostDto> {
  @ApiProperty()
  title: string

  @ApiProperty()
  content: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  authorName: string

  static toDto(post: PostWithAuthor): GetPostDto {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      userId: post.user_id,
      authorName: post.author.name,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      deletedAt: post.deleted_at ?? undefined,
    }
  }
}

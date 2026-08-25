import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

type PostWithAuthor = {
  id: string
  title: string
  content: string
  user_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  author_name: string
}

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
      authorName: post.author_name,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      deletedAt: post.deleted_at ?? undefined,
    }
  }
}

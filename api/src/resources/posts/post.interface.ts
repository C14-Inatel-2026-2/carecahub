import { ServiceOutput, UserMetadata } from '@/types'
import { List } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetPostDto } from './dto/get-post.dto'
import { CreatePostDto, UpdatePostDto } from './dto/upsert-post.dto'

export type UpsertPostOutput = ServiceOutput<GetPostDto>
export type GetPostOutput = ServiceOutput<GetPostDto>
export type ListPostOutput = ServiceOutput<List<GetPostDto>>

export abstract class IPostsService {
  abstract create(input: CreatePostDto, requester: UserMetadata): Promise<UpsertPostOutput>
  abstract findAll(query: QueryDto): Promise<ListPostOutput>
  abstract findOne(id: string): Promise<GetPostOutput>
  abstract update(
    id: string,
    input: UpdatePostDto,
    requester: UserMetadata,
  ): Promise<UpsertPostOutput>
  abstract remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>>
}

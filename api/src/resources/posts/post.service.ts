import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/providers/database/prisma.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetPostDto } from './dto/get-post.dto'
import { CreatePostDto, UpdatePostDto } from './dto/upsert-post.dto'
import { GetPostOutput, IPostsService, ListPostOutput, UpsertPostOutput } from './post.interface'

const postInclude = { author: true } as const

@Injectable()
export class PostsService implements IPostsService {
  constructor(private readonly database: PrismaService) {}

  async create(input: CreatePostDto, requester: UserMetadata): Promise<UpsertPostOutput> {
    const post = await this.database.posts.create({
      data: { ...input, user_id: requester.userId },
      include: postInclude,
    })

    return { ok: true, ...GetPostDto.toDto(post) }
  }

  async findAll(query: QueryDto): Promise<ListPostOutput> {
    const where = query.search
      ? {
          deleted_at: null,
          OR: [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { content: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : { deleted_at: null }
    const [posts, totalCount] = await Promise.all([
      this.database.posts.findMany({
        where,
        include: postInclude,
        skip: query.skip,
        take: query.take,
        orderBy: { created_at: 'desc' },
      }),
      this.database.posts.count({ where }),
    ])

    return { ok: true, totalCount, data: posts.map(GetPostDto.toDto) }
  }

  async findOne(id: string): Promise<GetPostOutput> {
    const post = await this.database.posts.findFirst({
      where: { id, deleted_at: null },
      include: postInclude,
    })
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetPostDto.toDto(post) }
  }

  async update(
    id: string,
    input: UpdatePostDto,
    requester: UserMetadata,
  ): Promise<UpsertPostOutput> {
    const post = await this.database.posts.findFirst({ where: { id, deleted_at: null } })
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(post.user_id, requester))
      return { ok: false, errKey: ErrKeys.noAccessToFeature }

    const updatedPost = await this.database.posts.update({
      where: { id },
      data: input,
      include: postInclude,
    })
    return { ok: true, ...GetPostDto.toDto(updatedPost) }
  }

  async remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>> {
    const post = await this.database.posts.findFirst({ where: { id, deleted_at: null } })
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(post.user_id, requester))
      return { ok: false, errKey: ErrKeys.noAccessToFeature }

    await this.database.posts.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
    return { ok: true }
  }

  private canManage(authorId: string, requester: UserMetadata) {
    return requester.role === 'admin' || requester.userId === authorId
  }
}

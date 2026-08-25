import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { ErrKeys, ServiceOutput, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { GetPostDto } from './dto/get-post.dto'
import { CreatePostDto, UpdatePostDto } from './dto/upsert-post.dto'
import { GetPostOutput, IPostsService, ListPostOutput, UpsertPostOutput } from './post.interface'

@Injectable()
export class PostsService implements IPostsService {
  constructor(private readonly database: DrizzleService) {}

  async create(input: CreatePostDto, requester: UserMetadata): Promise<UpsertPostOutput> {
    const [post] = await this.database.posts
      .insert({
        ...input,
        user_id: requester.userId,
      })
      .returning({ id: this.database.posts.table.id })

    const completePost = await this.findPostRecordById(post.id)
    if (!completePost) return { ok: false, errKey: ErrKeys.notFound }

    return { ok: true, ...GetPostDto.toDto(completePost) }
  }

  async findAll(query: QueryDto): Promise<ListPostOutput> {
    const where = query.search
      ? and(
          isNull(this.database.posts.table.deleted_at),
          or(
            ilike(this.database.posts.table.title, `%${query.search}%`),
            ilike(this.database.posts.table.content, `%${query.search}%`),
          ),
        )
      : isNull(this.database.posts.table.deleted_at)
    const [posts, totalCount] = await Promise.all([
      this.database.db
        .select({
          id: this.database.posts.table.id,
          title: this.database.posts.table.title,
          content: this.database.posts.table.content,
          user_id: this.database.posts.table.user_id,
          created_at: this.database.posts.table.created_at,
          updated_at: this.database.posts.table.updated_at,
          deleted_at: this.database.posts.table.deleted_at,
          author_name: this.database.users.table.name,
        })
        .from(this.database.posts.table)
        .innerJoin(
          this.database.users.table,
          eq(this.database.users.table.id, this.database.posts.table.user_id),
        )
        .where(where)
        .orderBy(desc(this.database.posts.table.created_at))
        .offset(query.skip)
        .limit(query.take),
      this.database.db
        .select({ count: count() })
        .from(this.database.posts.table)
        .where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: posts.map(GetPostDto.toDto),
    }
  }

  async findOne(id: string): Promise<GetPostOutput> {
    const post = await this.findPostRecordById(id)
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetPostDto.toDto(post) }
  }

  async update(
    id: string,
    input: UpdatePostDto,
    requester: UserMetadata,
  ): Promise<UpsertPostOutput> {
    const [post] = await this.database.posts
      .select(this.database.posts.columns)
      .where(
        and(eq(this.database.posts.table.id, id), isNull(this.database.posts.table.deleted_at)),
      )
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(post.user_id, requester))
      return { ok: false, errKey: ErrKeys.noAccessToFeature }

    await this.database.posts
      .update()
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where(eq(this.database.posts.table.id, id))

    const updatedPost = await this.findPostRecordById(id)
    if (!updatedPost) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetPostDto.toDto(updatedPost) }
  }

  async remove(id: string, requester: UserMetadata): Promise<ServiceOutput<object>> {
    const [post] = await this.database.posts
      .select(this.database.posts.columns)
      .where(
        and(eq(this.database.posts.table.id, id), isNull(this.database.posts.table.deleted_at)),
      )
    if (!post) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.canManage(post.user_id, requester))
      return { ok: false, errKey: ErrKeys.noAccessToFeature }

    await this.database.posts
      .update()
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(this.database.posts.table.id, id))
    return { ok: true }
  }

  private async findPostRecordById(id: string) {
    const [post] = await this.database.db
      .select({
        id: this.database.posts.table.id,
        title: this.database.posts.table.title,
        content: this.database.posts.table.content,
        user_id: this.database.posts.table.user_id,
        created_at: this.database.posts.table.created_at,
        updated_at: this.database.posts.table.updated_at,
        deleted_at: this.database.posts.table.deleted_at,
        author_name: this.database.users.table.name,
      })
      .from(this.database.posts.table)
      .innerJoin(
        this.database.users.table,
        eq(this.database.users.table.id, this.database.posts.table.user_id),
      )
      .where(and(eq(this.database.posts.table.id, id), isNull(this.database.posts.table.deleted_at)))

    return post
  }

  private canManage(authorId: string, requester: UserMetadata) {
    return requester.role === 'admin' || requester.userId === authorId
  }
}

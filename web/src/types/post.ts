import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  content: z.string().min(1, 'O conteúdo é obrigatório.'),
})
export type CreatePostRequest = z.infer<typeof createPostSchema>

export const updatePostSchema = createPostSchema.partial()
export type UpdatePostRequest = z.infer<typeof updatePostSchema>

export type Post = {
  id: string
  title: string
  content: string
  userId: string
  authorName: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type GetPostResponse = Post

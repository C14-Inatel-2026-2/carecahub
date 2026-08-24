import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

export const updateUserSchema = createUserSchema.pick({
  name: true,
  email: true,
})
export type CreateUserRequest = z.infer<typeof createUserSchema>

export const userFormSchema = updateUserSchema.extend({
  password: z.string().optional(),
})
export type UpdateUserRequest = z.infer<typeof updateUserSchema>

export type UserRole = 'admin' | 'user'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'inactive' | 'deleted'
  twoFactor: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type GetUserResponse = User

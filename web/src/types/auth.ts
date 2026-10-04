import { z } from 'zod'
import type { UserRole } from '@/types/user'

export type LoginRequest = z.infer<typeof loginSchema>

export type TwoFactorAuthRequest = {
  email: string
  code: string
}

const passwordSchema = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.')

export const loginSchema = z.object({
  username: z.email('Informe um e-mail válido.'),
  password: passwordSchema,
})

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: passwordSchema,
})

export type PasswordChangeRequest = z.infer<typeof passwordChangeSchema>
export type RecoverPasswordRequest = { email: string }
export type ResetPasswordRequest = { token: string; password: string }

export type LoggedUser = {
  id: string
  groupId?: string | null
  name: string
  email: string
  role: UserRole
}

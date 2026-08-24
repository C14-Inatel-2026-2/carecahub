/** biome-ignore-all lint/suspicious/noConfusingVoidType: body can be void */
import type { LoggedUser, LoginRequest, TwoFactorAuthRequest } from '@/types/auth'
import type { CreatePostRequest, Post, UpdatePostRequest } from '@/types/post'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/types/user'

/**
 * Central map of all write (POST/PATCH/PUT/DELETE) API endpoints.
 *
 * Key format: `"METHOD /path"` — e.g. `"POST /payments"`, `"PATCH /payments/:id"`
 *
 * To add a new endpoint, just add one entry here. That's it.
 */
export type WriterMap = {
  // ── Auth ──────────────────────────────────────────────────────────
  'POST /auth/login': {
    body: LoginRequest
    response: { user: LoggedUser }
  }
  'POST /auth/logout': {
    body: void
    response: object
  }
  'POST /auth/refresh-token': {
    body: void
    response: LoggedUser
  }
  'POST /auth/2fa': {
    body: TwoFactorAuthRequest
    response: { user: LoggedUser }
  }
  'POST /auth/recover-password': {
    body: { email: string }
    response: { message: string }
  }
  'POST /auth/reset-password': {
    body: { token: string; password: string }
    response: { message: string }
  }
  'POST /auth/change-password': {
    body: { oldPassword: string; newPassword: string }
    response: { message: string }
  }
  'POST /users': {
    body: CreateUserRequest
    response: User
  }
  'PATCH /users/:id': {
    body: UpdateUserRequest
    response: User
  }
  'DELETE /users/:id': {
    body: void
    response: object
  }
  'POST /posts': {
    body: CreatePostRequest
    response: Post
  }
  'PATCH /posts/:id': {
    body: UpdatePostRequest
    response: Post
  }
  'DELETE /posts/:id': {
    body: void
    response: object
  }
}

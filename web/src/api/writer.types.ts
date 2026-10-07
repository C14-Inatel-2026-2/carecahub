/** biome-ignore-all lint/suspicious/noConfusingVoidType: body can be void */
import type { LoggedUser, LoginRequest, TwoFactorAuthRequest } from '@/types/auth'
import type { CreateGroupRequest, Group, PromoteLeaderRequest } from '@/types/group'
import type {
  CreateGroupInviteRequest,
  Notification,
  RespondGroupInviteRequest,
  RespondGroupInviteResponse,
} from '@/types/notification'
import type { CreateProjectRequest, Project, UpdateProjectAppearanceRequest, UpdateProjectRequest } from '@/types/project'
import type {
  CreateRepositoryRequest,
  Repository,
  UpdateRepositoryRequest,
} from '@/types/repository'
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
  'POST /groups': {
    body: CreateGroupRequest
    response: Group
  }
  'POST /groups/:id/users': {
    body: { userId: string }
    response: User
  }
  'DELETE /groups/:id/users/:userId': {
    body: void
    response: User
  }
  'DELETE /groups/:id/leave': {
    body: void
    response: object
  }
  'PATCH /groups/:id/leader': {
    body: PromoteLeaderRequest
    response: Group
  }
  'DELETE /groups/:id': {
    body: void
    response: object
  }
  'POST /projects': {
    body: CreateProjectRequest
    response: Project
  }
  'PATCH /projects/:id': {
    body: UpdateProjectRequest
    response: Project
  }
  'PATCH /projects/:id/appearance': {
    body: UpdateProjectAppearanceRequest
    response: Project
  }
  'POST /files/public': {
    body: FormData
    response: { key: string; url: string }
  }
  'DELETE /projects/:id': {
    body: void
    response: object
  }
  'POST /repositories': {
    body: CreateRepositoryRequest
    response: Repository
  }
  'PATCH /repositories/:id': {
    body: UpdateRepositoryRequest
    response: Repository
  }
  'DELETE /repositories/:id': {
    body: void
    response: object
  }
  'POST /notifications/group-invites': {
    body: CreateGroupInviteRequest
    response: Notification
  }
  'PATCH /notifications/group-invites/:id/respond': {
    body: RespondGroupInviteRequest
    response: RespondGroupInviteResponse
  }
  'PATCH /notifications/read-all': {
    body: void
    response: { updatedCount: number }
  }
  'PATCH /notifications/:id/read': {
    body: void
    response: Notification
  }
}

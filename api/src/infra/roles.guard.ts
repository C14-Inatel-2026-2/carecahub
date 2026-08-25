import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import type { UserRole } from '@db'

export const ROLE_METADATA_KEY = 'RequiredRoleMetadata'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest<Request>()

    if (!user.role) return false

    const roles = this.reflector.getAllAndOverride(ROLE_METADATA_KEY, [context.getHandler()])

    return roles.includes(user.role)
  }
}

export function Roles(roles: UserRole[]) {
  return applyDecorators(SetMetadata(ROLE_METADATA_KEY, roles || []), UseGuards(RolesGuard))
}

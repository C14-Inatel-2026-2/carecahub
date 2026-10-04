import type { LoggedUser } from '@/types/auth'
import type { Group } from '@/types/group'

export function canPromoteGroupLeader(requester: LoggedUser, group: Group) {
  return requester.role === 'admin' || requester.id === group.leaderId
}

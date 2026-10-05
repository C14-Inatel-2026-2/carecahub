import { Search, User, UserStar } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Group } from '@/types/group'
import type { User as GroupMember } from '@/types/user'

export function ChangeGroupLeaderDialog({
  group,
  open,
  onOpenChange,
  onLeaderChange,
}: {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeaderChange: (leaderId: string) => Promise<boolean>
}) {
  const [search, setSearch] = useState('')
  const [changingId, setChangingId] = useState<string | null>(null)
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const members = group.members.filter(
    (member) =>
      !normalizedSearch ||
      member.name.toLocaleLowerCase().includes(normalizedSearch) ||
      member.email.toLocaleLowerCase().includes(normalizedSearch) ||
      member.githubName?.toLocaleLowerCase().includes(normalizedSearch)
  )

  async function changeLeader(member: GroupMember) {
    setChangingId(member.id)
    const changed = await onLeaderChange(member.id)
    setChangingId(null)
    if (changed) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Alterar líder</DialogTitle>
          <DialogDescription>
            Selecione um integrante do grupo para assumir a liderança.
          </DialogDescription>
        </DialogHeader>
        <label className='relative'>
          <span className='sr-only'>Buscar integrante</span>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className='pl-8'
            placeholder='Buscar por nome, e-mail ou GitHub'
          />
        </label>
        <div className='grid max-h-80 gap-2 overflow-y-auto'>
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className='flex items-center justify-between gap-3 rounded-lg border p-3'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  {member.gitHubDetails?.avatarUrl ? (
                    <img
                      src={member.gitHubDetails.avatarUrl}
                      alt={member.name}
                      className='size-9 shrink-0 rounded-full'
                    />
                  ) : (
                    <User className='size-9 shrink-0 text-muted-foreground' />
                  )}
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{member.name}</p>
                    <p className='truncate text-xs text-muted-foreground'>{member.email}</p>
                  </div>
                </div>
                {member.id === group.leaderId ? (
                  <Badge className='bg-highlight-soft text-highlight-soft-foreground'>
                    Líder atual
                  </Badge>
                ) : (
                  <Button
                    type='button'
                    size='sm'
                    disabled={changingId !== null}
                    onClick={() => void changeLeader(member)}
                  >
                    <UserStar />
                    {changingId === member.id ? 'Alterando…' : 'Definir como líder'}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
              Nenhum integrante encontrado.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

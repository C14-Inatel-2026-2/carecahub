import { CircleUserRound, Mail, Search, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useList } from '@/api'
import { writer } from '@/api/writer'
import { GitHubIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/lib/use-debounce'
import type { User } from '@/types/user'
import { InviteUserCard } from '../components/invite-user-card'

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 350)
  const { data, isLoading, mutate } = useList({
    endpoint: '/notifications/group-invites/candidates',
    params: {
      skip: 0,
      take: 100,
      search: debouncedSearch.trim() || undefined,
    },
    disabled: !open,
  })

  async function invite(candidate: User) {
    setInvitingId(candidate.id)
    const result = await writer('POST /notifications/group-invites', {
      body: { inviteeId: candidate.id },
      onSuccessMessage: `Convite enviado para ${candidate.name}`,
    })
    setInvitingId(null)
    if (result.ok) void mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<InviteUserCard />} />
      <DialogContent className='sm:max-w-lg'>
        <InviteUserDialogPanel
          search={search}
          onSearchChange={setSearch}
          candidates={data}
          isLoading={isLoading}
          invitingId={invitingId}
          onInvite={(candidate) => void invite(candidate)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function InviteUserDialogPanel({
  search,
  onSearchChange,
  candidates,
  isLoading,
  invitingId,
  onInvite,
}: {
  search: string
  onSearchChange: (value: string) => void
  candidates: User[]
  isLoading: boolean
  invitingId: string | null
  onInvite: (candidate: User) => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Convidar integrante</DialogTitle>
        <DialogDescription>Busque entre os alunos disponíveis para projetos.</DialogDescription>
      </DialogHeader>
      <label className='relative'>
        <span className='sr-only'>Buscar por nome, e-mail ou GitHub</span>
        <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className='pl-8'
          placeholder='Buscar por nome, e-mail ou GitHub'
        />
      </label>
      <div className='grid max-h-80 gap-2 overflow-y-auto' aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </>
        ) : candidates.length > 0 ? (
          candidates.map((candidate) => (
            <InviteCandidateRow
              key={candidate.id}
              candidate={candidate}
              isInviting={invitingId === candidate.id}
              onInvite={onInvite}
            />
          ))
        ) : (
          <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
            Nenhum aluno disponível encontrado.
          </p>
        )}
      </div>
    </>
  )
}

export function InviteCandidateRow({
  candidate,
  isInviting,
  onInvite,
}: {
  candidate: User
  isInviting: boolean
  onInvite: (candidate: User) => void
}) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-3'>
        {candidate.gitHubDetails?.avatarUrl ? (
          <img
            src={candidate.gitHubDetails.avatarUrl}
            alt={candidate.name}
            className='size-9 shrink-0 rounded-full'
          />
        ) : (
          <CircleUserRound className='size-9 shrink-0 text-highlight-soft-foreground' />
        )}
        <div className='min-w-0'>
          <p className='truncate font-medium'>{candidate.name}</p>
          <p className='mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
            <Mail className='size-3.5' /> {candidate.email}
          </p>
          <p className='mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
            <GitHubIcon className='size-3.5' /> {candidate.githubName || 'Sem GitHub'}
          </p>
        </div>
      </div>
      <Button type='button' size='sm' disabled={isInviting} onClick={() => onInvite(candidate)}>
        <UserPlus /> {isInviting ? 'Enviando…' : 'Convidar'}
      </Button>
    </div>
  )
}

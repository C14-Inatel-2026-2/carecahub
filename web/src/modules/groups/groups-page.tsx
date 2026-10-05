import { Crown } from 'lucide-react'
import { useList } from '@/api'
import { writer } from '@/api/writer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isMockAPIEnabled } from '@/mocks/config'
import { useUser } from '@/stores/use-user'
import type { Group } from '@/types/group'
import { canPromoteGroupLeader } from './group-permissions'

export function GroupsPage() {
  const user = useUser((state) => state.user)
  const {
    data: groups,
    isLoading,
    mutate,
  } = useList({
    endpoint: '/groups',
    params: { take: 100 },
    disabled: isMockAPIEnabled || !user,
  })

  async function promote(group: Group, leaderId: string) {
    const result = await writer('PATCH /groups/:id/leader', {
      params: { id: group.id },
      body: { leaderId },
      onSuccessMessage: 'Novo líder definido',
    })
    if (result.ok) void mutate()
  }

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <h1 className='text-lg font-medium'>Grupos</h1>
      <p className='mt-0.5 text-xs text-muted-foreground'>Gerencie os grupos no CarecaHub.</p>

      <div className='mt-6 grid gap-4 lg:grid-cols-2'>
        {groups.map((group) => (
          <Card key={group.id} className='gap-0 rounded-lg border bg-card p-5 ring-0'>
            <div className='flex items-center justify-between gap-3'>
              <h2 className='font-medium text-highlight-soft-foreground'>{group.friendlyId}</h2>
              <Badge variant='outline'>{group.members.length}/6 membros</Badge>
            </div>
            <div className='mt-4 grid gap-2'>
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className='flex items-center justify-between gap-3 rounded-md border p-3'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{member.name}</p>
                    <p className='truncate text-xs text-muted-foreground'>{member.email}</p>
                  </div>
                  {group.leaderId === member.id ? (
                    <Badge className='bg-highlight-soft text-highlight-soft-foreground'>
                      <Crown /> Líder
                    </Badge>
                  ) : user && canPromoteGroupLeader(user, group) ? (
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() => promote(group, member.id)}
                    >
                      Promover a líder do grupo
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {isLoading && <p className='mt-6 text-sm text-muted-foreground'>Carregando grupos…</p>}
      {!isLoading && groups.length === 0 && (
        <p className='mt-6 text-sm text-muted-foreground'>Nenhum grupo encontrado.</p>
      )}
    </section>
  )
}

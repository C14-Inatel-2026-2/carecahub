import { CalendarClock, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/lib/use-debounce'
import { isMockAPIEnabled } from '@/mocks/config'
import { activityDetailsRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { canManageActivities, formatDueDate } from './activity-helpers'
import { ActivityStatusBadge } from './components/activity-status-badge'
import { ActivityFormDialog } from './dialogs/activity-form-dialog'

export function ActivitiesPage() {
  const user = useUser((state) => state.user)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)
  const { data: activities, isLoading } = useList({
    endpoint: '/activities',
    params: { take: 100, search: debouncedSearch.trim() || undefined },
    disabled: isMockAPIEnabled || !user,
  })

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-lg font-medium'>Atividades</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {canManageActivities(user)
              ? 'Publique atividades e acompanhe as entregas dos grupos.'
              : 'Veja as atividades da turma e envie as entregas do seu grupo.'}
          </p>
        </div>
        {canManageActivities(user) && (
          <ActivityFormDialog onSaved={(activity) => navigate(activityDetailsRoute(activity.id))} />
        )}
      </div>

      <label className='relative mt-6 block max-w-md'>
        <span className='sr-only'>Buscar atividades</span>
        <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted' />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className='pl-8'
          placeholder='Buscar pelo título…'
        />
      </label>

      <div className='mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activityDetailsRoute(activity.id)}
            className='rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
          >
            <Card className='h-full transition-colors hover:bg-muted/40'>
              <CardHeader>
                <div className='flex items-start justify-between gap-2'>
                  <CardTitle className='line-clamp-2'>{activity.title}</CardTitle>
                  <ActivityStatusBadge activity={activity} />
                </div>
                <CardDescription className='flex items-center gap-1.5'>
                  <CalendarClock className='size-3.5' />
                  Prazo: {formatDueDate(activity.dueDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='line-clamp-3 text-sm text-muted-foreground'>{activity.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className='h-40 w-full' />
          ))}
        </div>
      )}
      {!isLoading && activities.length === 0 && (
        <p className='mt-6 text-sm text-muted-foreground'>
          {debouncedSearch ? 'Nenhuma atividade encontrada.' : 'Nenhuma atividade publicada ainda.'}
        </p>
      )}
    </section>
  )
}

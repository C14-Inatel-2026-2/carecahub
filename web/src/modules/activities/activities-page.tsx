import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useList } from '@/api'
import { Button } from '@/components/ui/button'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { ActivityCard } from './components/activity-card'

export function ActivitiesPage() {
  const user = useUser((state) => state.user)
  const { data: activities, isLoading } = useList({
    endpoint: '/activities',
    params: { skip: 0, take: 100 },
  })
  const canManage = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'mentor'

  return (
    <section className='flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='text-lg font-medium'>Atividades</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Acompanhe prazos, entregas e avaliações.
          </p>
        </div>
        {canManage && (
          <Button render={<Link to={appRoutes.createActivity} />} variant='highlight' type='button'>
            <Plus />
            Nova atividade
          </Button>
        )}
      </div>
      <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      {!isLoading && activities.length === 0 && (
        <p className='mt-6 text-sm text-muted-foreground'>Nenhuma atividade publicada.</p>
      )}
      {isLoading && <p className='mt-6 text-sm text-muted-foreground'>Carregando atividades…</p>}
    </section>
  )
}

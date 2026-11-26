import { ArrowLeft, Box, CircleUserRound, Eye, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useGet } from '@/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activityDetailsRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { Activity, ActivityGroupDelivery } from '@/types/activity'
import type { UserRole } from '@/types/user'
import { SubmissionHistory } from './components/submission-history'

export function canEvaluateDelivery(role?: UserRole) {
  return role === 'teacher' || role === 'mentor'
}

const noop = () => undefined

export function ActivityGroupDeliveryPage() {
  const { activityId, groupId } = useParams()
  const user = useUser((state) => state.user)
  const { data: activity, isLoading: isLoadingActivity } = useGet('/activities/:id', activityId)
  const {
    data: delivery,
    isLoading: isLoadingDelivery,
    mutate,
  } = useGet('/activities/:id/group-delivery', activityId, { groupId }, !activityId || !groupId)

  if (isLoadingActivity || isLoadingDelivery)
    return <main className='p-6 text-sm text-muted-foreground'>Carregando entrega…</main>
  if (!activity || !delivery)
    return <main className='p-6 text-sm text-muted-foreground'>Entrega não encontrada.</main>

  return (
    <ActivityGroupDeliveryContent
      activity={activity}
      canEvaluate={canEvaluateDelivery(user?.role)}
      delivery={delivery}
      onUpdated={() => void mutate()}
    />
  )
}

export function ActivityGroupDeliveryContent({
  activity,
  delivery,
  canEvaluate,
  onUpdated = noop,
}: {
  activity: Activity
  delivery: ActivityGroupDelivery
  canEvaluate: boolean
  onUpdated?: () => void
}) {
  const project = delivery.project ?? delivery.group.project

  return (
    <section className='flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <Button
        className='mb-5 w-fit'
        render={<Link to={activityDetailsRoute(activity.id)} />}
        variant='ghost'
      >
        <ArrowLeft />
        Voltar para atividade
      </Button>

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>{activity.title}</p>
          <h1 className='text-lg font-medium'>Entrega do {delivery.group.friendlyId}</h1>
        </div>
      </div>

      <div className='mt-6 grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Grupo e projeto</CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-3'>
            {project?.iconUrl ? (
              <img alt='' className='size-10 rounded-full object-cover' src={project.iconUrl} />
            ) : (
              <Box className='size-10 text-highlight-soft-foreground' />
            )}
            <div>
              <p className='font-medium'>{delivery.group.friendlyId}</p>
              <p className='text-sm text-muted-foreground'>
                {project?.projectName ?? 'Projeto não vinculado'}
              </p>
              <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                <Users className='size-3.5' />
                {delivery.group.members.length}{' '}
                {delivery.group.members.length === 1 ? 'membro' : 'membros'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Eye className='size-4' />
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delivery.viewers.length ? (
              <ul className='grid gap-2 text-sm'>
                {delivery.viewers.map((viewer) => {
                  const member = delivery.group.members.find((item) => item.id === viewer.id)

                  return (
                    <li key={viewer.id} className='flex items-center gap-3'>
                      {member?.gitHubDetails?.avatarUrl ? (
                        <img
                          alt={viewer.name}
                          className='size-8 rounded-full'
                          src={member.gitHubDetails.avatarUrl}
                        />
                      ) : (
                        <CircleUserRound className='size-8 text-highlight-soft-foreground' />
                      )}
                      <span>{viewer.name}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Nenhum integrante visualizou a atividade.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <SubmissionHistory
        activityId={activity.id}
        canEvaluate={canEvaluate}
        onUpdated={onUpdated}
        submissions={delivery.submissions}
      />
    </section>
  )
}

import { ArrowLeft, CalendarClock } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGet, useList } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isMockAPIEnabled } from '@/mocks/config'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { canManageActivities, formatDueDate } from './activity-helpers'
import { ActivityStatusBadge } from './components/activity-status-badge'
import { StudentSubmissionCard } from './components/student-submission-card'
import { SubmissionsTable } from './components/submissions-table'
import { ActivityFormDialog } from './dialogs/activity-form-dialog'
import { DeleteActivityDialog } from './dialogs/delete-activity-dialog'

export function ActivityDetailsPage() {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()
  const user = useUser((state) => state.user)
  const isStudent = user?.role === 'student'
  const canManage = canManageActivities(user)

  const { data: activity, isLoading, error, mutate } = useGet('/activities/:id', activityId)
  const { data: submissions, mutate: mutateSubmissions } = useGet(
    '/activities/:id/submissions',
    activityId
  )
  const { data: groups } = useList({
    endpoint: '/groups',
    params: { take: 100 },
    disabled: isMockAPIEnabled || !user || isStudent,
  })
  const groupNames = Object.fromEntries(groups.map((group) => [group.id, group.friendlyId]))
  const submissionList = submissions?.data ?? []

  if (isLoading) {
    return (
      <section className='grid w-full gap-4 px-4 py-5 md:px-6 lg:px-8'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-48 w-full' />
      </section>
    )
  }

  if (error || !activity) {
    return (
      <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
        <p className='text-sm text-muted-foreground'>Atividade não encontrada.</p>
        <Link to={appRoutes.activities} className='mt-2 inline-block text-sm underline'>
          Voltar para as atividades
        </Link>
      </section>
    )
  }

  return (
    <section className='grid w-full gap-4 px-4 py-5 md:px-6 lg:px-8'>
      <Link
        to={appRoutes.activities}
        className='inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Atividades
      </Link>

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-lg font-medium'>{activity.title}</h1>
            <ActivityStatusBadge activity={activity} />
          </div>
          <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <CalendarClock className='size-3.5' />
            Prazo: {formatDueDate(activity.dueDate)}
            {activity.allowLateSubmissions && ' · aceita entregas atrasadas'}
          </p>
        </div>
        {canManage && (
          <div className='flex gap-2'>
            <ActivityFormDialog activity={activity} onSaved={() => void mutate()} />
            <DeleteActivityDialog
              activity={activity}
              onDeleted={() => navigate(appRoutes.activities)}
            />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instruções</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm whitespace-pre-wrap'>{activity.description}</p>
        </CardContent>
      </Card>

      {isStudent ? (
        <StudentSubmissionCard
          key={submissionList[0]?.url ?? 'no-submission'}
          activity={activity}
          submission={submissionList[0]}
          onSubmitted={() => void mutateSubmissions()}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Entregas ({submissionList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionsTable
              submissions={submissionList}
              groupNames={groupNames}
              canGrade={canManage}
              onGraded={() => void mutateSubmissions()}
            />
          </CardContent>
        </Card>
      )}
    </section>
  )
}

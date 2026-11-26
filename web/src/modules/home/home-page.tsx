import { Bell, CalendarClock, CheckCircle2, ClipboardList, FolderKanban, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { useGet, useList } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { activityDetailsRoute, appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'

const listParams = { skip: 0, take: 100 } as const

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number
  icon: typeof CalendarClock
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-xs text-muted-foreground'>{label}</p>
          <p className='mt-1 text-2xl font-semibold tabular-nums'>{loading ? '—' : value}</p>
        </div>
        <div className='rounded-lg bg-highlight-soft p-2.5 text-highlight-soft-foreground'>
          <Icon className='size-5' />
        </div>
      </CardContent>
    </Card>
  )
}

export function HomePage() {
  const user = useUser((state) => state.user)
  const isStudent = user?.role === 'student'
  const isAdmin = user?.role === 'admin'
  const canTrack = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'mentor'
  const {
    data: activities,
    totalCount: activityCount,
    isLoading: isLoadingActivities,
  } = useList({
    endpoint: '/activities',
    params: listParams,
  })
  const { unreadCount, isLoading: isLoadingNotifications } = useList({
    endpoint: '/notifications',
    params: listParams,
  })
  const {
    data: projects,
    totalCount: projectCount,
    isLoading: isLoadingProjects,
  } = useList({
    endpoint: '/projects',
    params: listParams,
  })
  const projectId = projects[0]?.id
  const { data: contributionSummary, isLoading: isLoadingContributions } = useGet(
    '/projects/:id/contributions',
    projectId,
    undefined,
    !isStudent || !projectId
  )
  const { totalCount: groupCount, isLoading: isLoadingGroups } = useList({
    endpoint: '/groups',
    params: listParams,
    disabled: !canTrack,
  })
  const { totalCount: userCount, isLoading: isLoadingUsers } = useList({
    endpoint: '/users',
    params: listParams,
    disabled: !isAdmin,
  })

  const now = new Date()
  const activityStatus = useMemo(() => {
    const summary = { todo: 0, overdue: 0, submitted: 0 }
    for (const activity of activities) {
      if (activity.submission) summary.submitted += 1
      else if (new Date(activity.dueAt) < now) summary.overdue += 1
      else summary.todo += 1
    }
    return summary
  }, [activities, now])
  const upcomingActivities = useMemo(
    () =>
      [...activities]
        .filter((activity) => new Date(activity.dueAt) >= now)
        .sort((first, second) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime())
        .slice(0, 5),
    [activities, now]
  )
  const chartData = useMemo(() => {
    if (isStudent)
      return (contributionSummary?.data ?? []).map((contributor) => ({
        label: contributor.name,
        value: contributor.commits,
      }))

    const perDate = new Map<string, number>()
    for (const activity of upcomingActivities) {
      const date = formatDate(activity.dueAt)
      perDate.set(date, (perDate.get(date) ?? 0) + 1)
    }
    return [...perDate].map(([label, activities]) => ({ label, value: activities }))
  }, [contributionSummary, isStudent, upcomingActivities])

  if (!user) return <Navigate to={appRoutes.login} />

  const isLoading = isLoadingActivities || isLoadingNotifications || isLoadingProjects
  const chartConfig = {
    value: {
      label: isStudent ? 'Commits' : 'Atividades',
      color: 'var(--highlight)',
    },
  } satisfies ChartConfig

  return (
    <section className='flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Olá, {user.name}.</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Acompanhe o que precisa da sua atenção hoje.
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <Link
            className='text-primary underline-offset-4 hover:underline'
            to={appRoutes.activities}
          >
            Ver atividades
          </Link>
          <span className='text-muted-foreground'>·</span>
          <Link
            className='text-primary underline-offset-4 hover:underline'
            to={appRoutes.notifications}
          >
            Notificações
          </Link>
        </div>
      </header>

      <div className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {isStudent ? (
          <>
            <MetricCard
              label='A fazer'
              value={activityStatus.todo}
              icon={ClipboardList}
              loading={isLoading}
            />
            <MetricCard
              label='Em atraso'
              value={activityStatus.overdue}
              icon={CalendarClock}
              loading={isLoading}
            />
            <MetricCard
              label='Entregues'
              value={activityStatus.submitted}
              icon={CheckCircle2}
              loading={isLoading}
            />
            <MetricCard
              label='Notificações não lidas'
              value={unreadCount}
              icon={Bell}
              loading={isLoadingNotifications}
            />
          </>
        ) : (
          <>
            <MetricCard
              label='Atividades publicadas'
              value={activityCount}
              icon={ClipboardList}
              loading={isLoadingActivities}
            />
            <MetricCard
              label='Projetos acompanhados'
              value={projectCount}
              icon={FolderKanban}
              loading={isLoadingProjects}
            />
            <MetricCard label='Grupos' value={groupCount} icon={Users} loading={isLoadingGroups} />
            <MetricCard
              label={isAdmin ? 'Usuários cadastrados' : 'Notificações não lidas'}
              value={isAdmin ? userCount : unreadCount}
              icon={isAdmin ? Users : Bell}
              loading={isAdmin ? isLoadingUsers : isLoadingNotifications}
            />
          </>
        )}
      </div>

      <div className='mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]'>
        <Card>
          <CardHeader>
            <CardTitle>{isStudent ? 'Commits por integrante' : 'Próximos prazos'}</CardTitle>
            <p className='text-sm text-muted-foreground'>
              {isStudent
                ? 'Commits do histórico completo dos repositórios do seu projeto.'
                : 'Quantidade de atividades com prazo em cada data próxima.'}
            </p>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <ChartContainer className='h-64 w-full' config={chartConfig}>
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis axisLine={false} dataKey='label' tickLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
                  <Bar dataKey='value' fill='var(--color-value)' radius={6} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className='grid h-64 place-items-center text-center text-sm text-muted-foreground'>
                {isStudent && isLoadingContributions
                  ? 'Carregando contribuições do grupo…'
                  : isStudent
                    ? 'Ainda não há contribuições para exibir.'
                    : 'Nenhuma atividade próxima para exibir.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos prazos</CardTitle>
            <p className='text-sm text-muted-foreground'>Organize sua próxima ação.</p>
          </CardHeader>
          <CardContent>
            {upcomingActivities.length ? (
              <ol className='relative grid gap-4 border-l border-border pl-4'>
                {upcomingActivities.map((activity) => (
                  <li key={activity.id} className='relative'>
                    <span className='absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-highlight ring-4 ring-card' />
                    <Link
                      className='font-medium hover:text-primary hover:underline'
                      to={activityDetailsRoute(activity.id)}
                    >
                      {activity.title}
                    </Link>
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      Entrega em {formatDate(activity.dueAt)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='text-sm text-muted-foreground'>Nenhum prazo futuro.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

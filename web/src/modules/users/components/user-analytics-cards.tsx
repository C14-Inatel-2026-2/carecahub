import { BookOpenCheck, GraduationCap, ShieldCheck, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserAnalyticsResponse } from '@/types/user'
import { getUserAnalyticsMetrics, USER_ANALYTICS_METRICS } from '../user-analytics'

const metricIcons = [Users, ShieldCheck, GraduationCap, UserRound, BookOpenCheck] as const

type UserAnalyticsCardsProps = {
  data?: UserAnalyticsResponse
  error?: Error
  isLoading: boolean
  onRetry: () => void
}

export function UserAnalyticsCards({ data, error, isLoading, onRetry }: UserAnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div
        className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'
        aria-label='Carregando indicadores de usuários'
        aria-busy='true'
      >
        {USER_ANALYTICS_METRICS.map(({ key }) => (
          <Card key={key} size='sm'>
            <CardHeader className='flex-row items-center justify-between'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='size-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-7 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className='mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3'
        role='alert'
      >
        <p className='text-sm text-destructive'>
          Não foi possível carregar os indicadores de usuários.
        </p>
        <Button type='button' variant='outline' size='sm' onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
      {getUserAnalyticsMetrics(data).map((metric, index) => {
        const Icon = metricIcons[index]

        return (
          <Card key={metric.key} size='sm' className='min-w-0 gap-2'>
            <CardHeader className='flex-row items-center justify-between gap-2'>
              <p className='truncate text-sm text-muted-foreground'>{metric.label}</p>
              <Icon className='size-4 shrink-0 text-icon-muted' aria-hidden='true' />
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-semibold tabular-nums text-foreground'>{metric.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

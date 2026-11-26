import { ClipboardCheck, Eye, EyeDashed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityPipeline } from '@/types/activity'
import { GroupPipelineRow } from './group-pipeline-row'

const pipelineStatusLabels: Record<string, string> = {
  not_viewed: 'Não visualizaram',
  viewed: 'Visualizaram',
  submitted: 'Entregaram',
  evaluated: 'Avaliadas',
}

export function ActivityPipeline({
  activityId,
  pipeline,
}: {
  activityId: string
  pipeline: ActivityPipeline
}) {
  return (
    <section className='mt-6'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <Card>
          <CardContent className='flex items-center justify-between gap-3 text-sm'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='shrink-0 rounded-md bg-gray-100/80 p-2 text-gray-500 dark:bg-gray-100/10'>
                <EyeDashed />
              </div>
              <span className='truncate'>Não visualizaram</span>
            </div>
            <strong className='shrink-0'>{pipeline.metrics.notViewed}%</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex items-center justify-between gap-3 text-sm'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='shrink-0 rounded-md bg-amber-100/80 p-2 text-amber-500 dark:bg-amber-100/10'>
                <Eye />
              </div>
              <span className='truncate'>Visualizaram</span>
            </div>
            <strong className='shrink-0'>{pipeline.metrics.viewed}%</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex items-center justify-between gap-3 text-sm'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='shrink-0 rounded-md bg-emerald-100/80 p-2 text-emerald-500 dark:bg-emerald-100/10'>
                <ClipboardCheck />
              </div>
              <span className='truncate'>Entregaram</span>
            </div>
            <strong className='shrink-0'>{pipeline.metrics.submitted}%</strong>
          </CardContent>
        </Card>
      </div>
      <div className='mt-4 flex gap-3 overflow-x-auto pb-2'>
        {Object.entries(pipeline.columns).map(([status, groups]) => (
          <Card key={status} className='min-w-72 flex-none lg:flex-1'>
            <CardHeader>
              <CardTitle className='text-sm'>{pipelineStatusLabels[status]}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2'>
              {groups.length > 0 ? (
                groups.map((group) => (
                  <GroupPipelineRow activityId={activityId} key={group.group.id} group={group} />
                ))
              ) : (
                <span className='text-sm text-muted-foreground'>Nenhum grupo</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

import { ClipboardCheck, Eye, EyeDashed, File } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGet } from '@/api'
import { API_BASE_URL } from '@/api/fetchers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/stores/use-user'
import type { Activity, Attachment } from '@/types/activity'
import { ActivityActions } from './components/activity-actions'
import {
  ActivityDetailsSkeleton,
  ActivityPipelineSkeleton,
} from './components/activity-details-skeleton'
import { ActivityRichTextContent } from './components/activity-rich-text'
import { GroupPipelineRow } from './components/group-pipeline-row'
import { SubmissionForm } from './components/submission-form'
import { SubmissionHistory } from './components/submission-history'

export function ActivityDetailsPage() {
  const { activityId } = useParams()
  const user = useUser((state) => state.user)
  const {
    data: activity,
    isLoading,
    mutate: mutateActivity,
  } = useGet('/activities/:id', activityId)
  const canTrack = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'mentor'
  const {
    data: pipeline,
    isLoading: isLoadingPipeline,
    mutate: mutatePipeline,
  } = useGet('/activities/:id/pipeline', activityId, undefined, !canTrack)
  const { data: submissions, mutate: mutateSubmissions } = useGet(
    '/activities/:id/submissions',
    activityId,
    undefined,
    user?.role !== 'student'
  )

  if (isLoading) return <ActivityDetailsSkeleton showPipeline={canTrack} />
  if (!activity)
    return <main className='p-6 text-sm text-muted-foreground'>Atividade não encontrada.</main>

  async function fetchAttachmentFile({
    activity,
    attachment,
  }: {
    activity: Activity
    attachment: Attachment
  }) {
    const response = await fetch(
      `${API_BASE_URL}/activities/${activity.id}/attachments/${attachment.id}/download`,
      { credentials: 'include' }
    )
    const data = (await response.json()) as { url?: string }
    if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className='flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-medium'>{activity.title}</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Prazo: {new Date(activity.dueAt).toLocaleString('pt-BR')}
          </p>
        </div>
        {(user?.role === 'teacher' || user?.role === 'mentor') && (
          <ActivityActions activity={activity} onChanged={() => void mutateActivity()} />
        )}
      </div>

      <div className='mt-6 max-w-3xl flex flex-col gap-3'>
        <p className='text-lg'>Instruções</p>
        <ActivityRichTextContent content={activity.description} />
      </div>

      {/* <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base"></CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityRichTextContent content={activity.description} />
        </CardContent>
      </Card> */}
      {activity.attachments.length > 0 && (
        <Card className='mt-4 max-w-3xl'>
          <CardHeader>
            <CardTitle className='text-base'>Materiais de referência</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2'>
            {activity.attachments.map((attachment) => (
              <button
                key={attachment.id}
                type='button'
                className='w-full flex flex-1 flex-row items-center gap-2 px-3 py-4 rounded bg-muted border border-muted-foreground/20 text-left text-base leading-tight hover:text-primary hover:underline'
                aria-label={`Visualizar ${attachment.filename}`}
                onClick={() => fetchAttachmentFile({ activity, attachment })}
              >
                <File className='size-5' />
                {attachment.filename}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
      {user?.role === 'student' && (
        <SubmissionForm
          activity={activity}
          onSubmitted={() => {
            void mutateSubmissions()
            if (canTrack) void mutatePipeline()
          }}
        />
      )}

      {canTrack && isLoadingPipeline && <ActivityPipelineSkeleton />}
      {pipeline && (
        <section className='mt-6'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <Card>
              <CardContent className='text-sm flex flex-row items-center justify-between'>
                <div className='flex flex-row gap-4 items-center'>
                  <div className='bg-amber-100/80 dark:bg-amber-100/10 text-amber-500 p-2 rounded-md'>
                    <Eye />
                  </div>{' '}
                  Visualizaram
                </div>{' '}
                <strong>{pipeline.metrics.viewed}%</strong>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='text-sm flex flex-row items-center justify-between'>
                <div className='flex flex-row gap-4 items-center'>
                  <div className='bg-emerald-100/80 dark:bg-emerald-100/10 text-emerald-500 p-2 rounded-md'>
                    <ClipboardCheck />
                  </div>{' '}
                  Entregaram
                </div>{' '}
                <strong>{pipeline.metrics.submitted}%</strong>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='text-sm flex flex-row items-center justify-between'>
                <div className='flex flex-row gap-4 items-center'>
                  <div className='bg-gray-100/80 dark:bg-gray-100/10 text-gray-500 p-2 rounded-md'>
                    <EyeDashed />
                  </div>{' '}
                  Não visualizaram
                </div>{' '}
                <strong>{pipeline.metrics.notViewed}%</strong>
              </CardContent>
            </Card>
          </div>
          <div className='mt-4 flex gap-3 overflow-x-auto pb-2'>
            {Object.entries(pipeline.columns).map(([status, groups]) => (
              <Card key={status} className='min-w-56 flex-1'>
                <CardHeader>
                  <CardTitle className='text-sm'>
                    {
                      (
                        {
                          not_viewed: 'Não visualizaram',
                          viewed: 'Visualizaram',
                          not_submitted: 'Não entregaram',
                          submitted: 'Entregaram',
                          evaluated: 'Avaliadas',
                        } as Record<string, string>
                      )[status]
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-2'>
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <GroupPipelineRow
                        activityId={activity.id}
                        key={group.group.id}
                        group={group}
                      />
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>Nenhum grupo</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
      {user?.role === 'student' && submissions && activityId && (
        <SubmissionHistory
          activityId={activityId}
          submissions={submissions.data}
          canEvaluate={false}
          onUpdated={() => void mutateSubmissions()}
        />
      )}
    </section>
  )
}

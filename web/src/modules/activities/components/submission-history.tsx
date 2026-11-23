import { useState } from 'react'
import { API_BASE_URL } from '@/api/fetchers'
import { writer } from '@/api/writer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActivitySubmission } from '@/types/activity'

export function SubmissionHistory({
  activityId,
  submissions,
  canEvaluate,
  onUpdated,
}: {
  activityId: string
  submissions: ActivitySubmission[]
  canEvaluate: boolean
  onUpdated: () => void
}) {
  const [scores, setScores] = useState<Record<string, string>>({})
  async function evaluate(submission: ActivitySubmission) {
    const score = Number(scores[submission.id] ?? submission.score)
    if (!Number.isInteger(score) || score < 0 || score > 100) return
    const result = await writer('PUT /activities/:id/submissions/:submissionId/evaluation', {
      params: { id: activityId, submissionId: submission.id },
      body: { score },
      silent: true,
    })
    if (result.ok) onUpdated()
  }
  return (
    <section className='mt-6 max-w-3xl'>
      <h2 className='mb-3 font-medium'>Histórico de entregas</h2>
      <div className='grid gap-3'>
        {submissions.map((submission) => (
          <article key={submission.id} className='rounded-lg border bg-card p-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='w-full'>
                <p className='flex flex-row justify-between items-center font-medium'>
                  Entrega versão {submission.version}
                  <div className='flex flex-row gap-2 justify-center items-center'>
                    {submission.score !== null && <Badge>Nota: {submission.score}</Badge>}
                  </div>
                  {submission.isLate && (
                    <Badge className='bg-amber-200 text-amber-700'>Em atraso</Badge>
                  )}
                </p>

                <p className='text-sm text-muted-foreground'>
                  Enviada por {submission.submittedBy.name} ·{' '}
                  {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {submission.score === null && canEvaluate && (
                  <>
                    <Input
                      className='w-20'
                      type='number'
                      min={0}
                      max={100}
                      value={scores[submission.id] ?? submission.score ?? ''}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [submission.id]: event.target.value,
                        }))
                      }
                    />
                    <Button size='sm' onClick={() => void evaluate(submission)}>
                      Avaliar
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className='mt-3 grid gap-1 text-sm'>
              {submission.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target='_blank'
                  rel='noreferrer'
                  className='flex min-w-0 items-center gap-2 text-primary underline-offset-4 hover:underline'
                >
                  {link.thumbnailUrl && (
                    <img
                      alt={`Prévia de ${link.url}`}
                      className='size-10 shrink-0 rounded border object-cover'
                      src={link.thumbnailUrl}
                    />
                  )}
                  <span className='truncate'>{link.url}</span>
                </a>
              ))}
              {submission.files.map((file) => (
                <button
                  key={file.id}
                  type='button'
                  className='text-left text-primary underline-offset-4 hover:underline'
                  onClick={async () => {
                    const response = await fetch(
                      `${API_BASE_URL}/activities/${activityId}/submissions/${submission.id}/files/${file.id}/download`,
                      { credentials: 'include' }
                    )
                    const data = (await response.json()) as { url?: string }
                    if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  {file.filename}
                </button>
              ))}
            </div>
          </article>
        ))}
        {submissions.length === 0 && (
          <p className='text-sm text-muted-foreground'>Nenhuma entrega registrada.</p>
        )}
      </div>
    </section>
  )
}

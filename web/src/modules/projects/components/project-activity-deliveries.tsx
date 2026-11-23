import { useGet } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProjectActivityDeliveries({ projectId }: { projectId: string }) {
  const { data, isLoading } = useGet('/projects/:id/activities', projectId)
  if (isLoading) return <p className='text-sm text-muted-foreground'>Carregando entregas…</p>
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Entregas</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-3'>
        {data?.data.length ? (
          data.data.map((delivery) => (
            <div
              key={delivery.submissionId}
              className='flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm'
            >
              <div>
                <p className='font-medium'>
                  {delivery.title} · versão {delivery.version}
                </p>
                <p className='text-muted-foreground'>
                  {new Date(delivery.submittedAt).toLocaleString('pt-BR')}
                  {delivery.isLate && ' · Em atraso'}
                </p>
              </div>
              <span className='font-medium'>
                {delivery.score === null ? 'Sem avaliação' : `Nota: ${delivery.score}`}
              </span>
            </div>
          ))
        ) : (
          <p className='text-sm text-muted-foreground'>Nenhuma entrega encontrada.</p>
        )}
      </CardContent>
    </Card>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

const pipelineColumns = Array.from({ length: 5 })

export function ActivityDetailsSkeleton({ showPipeline = true }: { showPipeline?: boolean }) {
  return (
    <section className='flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-56' />
          <Skeleton className='h-4 w-44' />
        </div>
        <Skeleton className='h-9 w-28' />
      </div>

      <div className='mt-6 max-w-3xl rounded-lg border p-6'>
        <Skeleton className='h-5 w-24' />
        <div className='mt-4 space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      </div>

      {showPipeline && <ActivityPipelineSkeleton />}
    </section>
  )
}

export function ActivityPipelineSkeleton() {
  return (
    <section className='mt-6'>
      <div className='grid gap-3 sm:grid-cols-3'>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className='h-20 w-full' />
        ))}
      </div>
      <div className='mt-4 flex gap-3 overflow-x-auto pb-2'>
        {pipelineColumns.map((_, columnIndex) => (
          <div key={columnIndex} className='min-w-72 flex-none rounded-lg border bg-card lg:flex-1'>
            <div className='p-6'>
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='grid gap-2 px-6 pb-6'>
              {Array.from({ length: 3 }, (_, cardIndex) => (
                <Skeleton key={cardIndex} className='h-16 w-full' />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export function GroupsSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {Array.from({ length: 9 }, (_, index) => (
        <div
          key={index}
          className='flex flex-col h-61 w-full p-5 rounded-sm shadow-lg/40 shadow-foreground/10 border border-border/70 bg-card'
        >
          <div className='flex flex-row items-center gap-4'>
            <Skeleton className='size-9 rounded-full' />
            <Skeleton className='w-24 h-6' />
          </div>
          <Skeleton className='w-14 h-7 mt-3' />
          <Skeleton className='w-20 h-4 mt-3' />
          <div className='grid grid-flow-col grid-cols-2 grid-rows-3 gap-x-4 gap-y-3.5 mt-4'>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className='w-full h-4' />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

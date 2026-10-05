import { Plus } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InviteUserCard({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant='outline'
      type='button'
      aria-label='Convidar integrante'
      className={cn(
        'flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-border bg-card p-4 drop-shadow-lg/40 drop-shadow-foreground/10 transition-all duration-200 hover:border-r-3 hover:border-b-3 active:translate-y-0.5',
        className
      )}
      {...props}
    >
      <span className='rounded-full bg-background p-2 shadow-[1px_1px_4px_0_var(--color-gray-500)]'>
        <Plus />
      </span>
      <span>Convidar integrante</span>
    </Button>
  )
}

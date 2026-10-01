import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardHeader className='grid grid-cols-[1fr_auto] items-center'>
        <CardTitle className='text-sm text-muted-foreground'>{label}</CardTitle>
        <Icon className='size-5 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <p className='text-3xl font-semibold tabular-nums'>{value.toLocaleString('pt-BR')}</p>
      </CardContent>
    </Card>
  )
}

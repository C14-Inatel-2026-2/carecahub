import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { Dashboard } from '@/types/dashboard'

const chartConfig = {
  count: { label: 'Commits', color: 'var(--color-primary)' },
} satisfies ChartConfig

const formatDay = (date: string) => {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

export function CommitCharts({
  commitsByDay,
  commitsByClassroom,
}: Pick<Dashboard, 'commitsByDay' | 'commitsByClassroom'>) {
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Commits por dia</CardTitle>
          <CardDescription>Atividade total nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-72 w-full aspect-auto'>
            <LineChart data={commitsByDay} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='date' tickFormatter={formatDay} minTickGap={24} />
              <YAxis allowDecimals={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey='count'
                type='monotone'
                stroke='var(--color-count)'
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commits por turma</CardTitle>
          <CardDescription>Autores identificados pelo usuário do GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-72 w-full aspect-auto'>
            <BarChart data={commitsByClassroom} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='classroom' />
              <YAxis allowDecimals={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

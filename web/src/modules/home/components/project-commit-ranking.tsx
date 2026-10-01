import { Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Dashboard } from '@/types/dashboard'

export function ProjectCommitRanking({ projects }: { projects: Dashboard['projectRanking'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='size-5' /> Projetos com mais commits
        </CardTitle>
        <CardDescription>Total histórico na branch principal</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            Nenhum projeto disponível.
          </p>
        ) : (
          <ol className='grid gap-2'>
            {projects.map((project, index) => (
              <li
                key={project.projectId}
                className='flex items-center gap-3 rounded-lg border px-3 py-2.5'
              >
                <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium'>
                  {index + 1}
                </span>
                <span className='min-w-0 flex-1 truncate font-medium'>{project.projectName}</span>
                <span className='tabular-nums text-muted-foreground'>
                  {project.commitCount.toLocaleString('pt-BR')} commits
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Submission } from '@/types/activity'
import { formatDueDate } from '../activity-helpers'
import { GradeSubmissionDialog } from '../dialogs/grade-submission-dialog'

export function SubmissionsTable({
  submissions,
  groupNames,
  canGrade,
  onGraded,
}: {
  submissions: Submission[]
  groupNames: Record<string, string>
  canGrade: boolean
  onGraded: () => void
}) {
  if (submissions.length === 0) {
    return <p className='text-sm text-muted-foreground'>Nenhum grupo enviou ainda.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Grupo</TableHead>
          <TableHead>Entrega</TableHead>
          <TableHead>Enviada em</TableHead>
          <TableHead>Nota</TableHead>
          {canGrade && <TableHead className='text-right'>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => {
          const groupName = groupNames[submission.groupId] ?? 'Grupo'
          return (
            <TableRow key={submission.id}>
              <TableCell className='font-medium'>{groupName}</TableCell>
              <TableCell>
                <a
                  href={submission.url}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex max-w-64 items-center gap-1 truncate underline-offset-4 hover:underline'
                >
                  <span className='truncate'>{submission.url}</span>
                  <ExternalLink className='size-3.5 shrink-0' />
                </a>
              </TableCell>
              <TableCell>
                <span className='flex items-center gap-2'>
                  {formatDueDate(submission.submittedAt)}
                  {submission.isLate && <Badge variant='destructive'>Atrasada</Badge>}
                </span>
              </TableCell>
              <TableCell>{submission.gradedAt ? submission.grade : '—'}</TableCell>
              {canGrade && (
                <TableCell className='text-right'>
                  <GradeSubmissionDialog
                    submission={submission}
                    groupName={groupName}
                    onGraded={onGraded}
                  />
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

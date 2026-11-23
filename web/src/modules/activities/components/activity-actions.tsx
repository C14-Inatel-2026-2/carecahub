import { Archive, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Activity } from '@/types/activity'
import { ActivityFormDialog } from '../dialogs/activity-form-dialog'

export function ActivityActions({
  activity,
  onChanged,
}: {
  activity: Activity
  onChanged: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  async function archive() {
    setArchiving(true)
    const result = await writer('PATCH /activities/:id/archive', {
      params: { id: activity.id },
      body: undefined,
      silent: true,
    })
    setArchiving(false)
    if (!result.ok) return toast.error(result.error.message)
    toast.success('Atividade arquivada')
    setArchiveOpen(false)
    onChanged()
  }
  return (
    <div className='flex gap-2'>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button size='lg' variant='outline' className='flex flex-row gap-3 items-center p-4' />
          }
        >
          <Pencil /> Editar
        </DialogTrigger>
        <ActivityFormDialog
          activity={activity}
          onSaved={() => {
            setEditOpen(false)
            onChanged()
          }}
        />
      </Dialog>
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogTrigger
          render={
            <Button size='lg' variant='outline' className='flex flex-row gap-3 items-center p-4' />
          }
        >
          <Archive /> Arquivar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar atividade?</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Ela deixará de aparecer para os alunos, mas o histórico será preservado.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setArchiveOpen(false)}>
              Cancelar
            </Button>
            <Button variant='destructive' disabled={archiving} onClick={() => void archive()}>
              {archiving ? 'Arquivando…' : 'Arquivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Activity } from '@/types/activity'

export function DeleteActivityDialog({
  activity,
  onDeleted,
}: {
  activity: Activity
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function remove() {
    setError('')
    setSubmitting(true)
    const result = await writer('DELETE /activities/:id', {
      params: { id: activity.id },
      body: undefined,
      silent: true,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error.friendlyMessage ?? result.error.message)
      return
    }
    toast.success('Atividade removida')
    setOpen(false)
    onDeleted()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' size='sm' variant='destructive' />}>
        <Trash2 />
        Remover
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover atividade?</DialogTitle>
          <DialogDescription>
            "{activity.title}" deixa de aparecer para os alunos. As entregas já enviadas continuam
            guardadas.
          </DialogDescription>
        </DialogHeader>
        {error && <p className='text-sm text-destructive'>{error}</p>}
        <DialogFooter>
          <Button variant='outline' type='button' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant='destructive'
            type='button'
            onClick={() => void remove()}
            disabled={submitting}
          >
            <Trash2 />
            {submitting ? 'Removendo…' : 'Remover atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

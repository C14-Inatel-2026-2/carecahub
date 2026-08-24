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
} from '@/components/ui/dialog'
import type { User } from '@/types/user'

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onDeleted,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function remove() {
    setError('')
    setSubmitting(true)
    const result = await writer('DELETE /users/:id', {
      params: { id: user.id },
      body: undefined,
      silent: true,
    })
    if (result.ok) {
      toast.success('Usuário excluído')
      onOpenChange(false)
      onDeleted()
    } else {
      setError(result.error.friendlyMessage ?? result.error.message)
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir usuário?</DialogTitle>
          <DialogDescription>
            A conta de {user.name} será removida. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        {error && <p className='text-sm text-destructive'>{error}</p>}
        <DialogFooter>
          <Button variant='outline' type='button' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant='destructive'
            type='button'
            onClick={() => void remove()}
            disabled={submitting}
          >
            <Trash2 />
            {submitting ? 'Excluindo…' : 'Excluir usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

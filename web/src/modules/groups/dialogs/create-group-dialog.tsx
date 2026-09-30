import { Plus } from 'lucide-react'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateGroupDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [friendlyId, setFriendlyId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    const value = friendlyId.trim()
    if (!value) return
    setIsSubmitting(true)
    const result = await writer('POST /groups', {
      body: { friendlyId: value },
      onSuccessMessage: 'Grupo criado',
    })
    setIsSubmitting(false)
    if (!result.ok) return
    setOpen(false)
    setFriendlyId('')
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' />}>
        <Plus /> Novo grupo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
          <DialogDescription>Você será definido como líder inicial do grupo.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-2'>
          <Label htmlFor='group-friendly-id'>Nome do grupo</Label>
          <Input
            id='group-friendly-id'
            value={friendlyId}
            maxLength={30}
            onChange={(event) => setFriendlyId(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type='button' disabled={!friendlyId.trim() || isSubmitting} onClick={submit}>
            Criar grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

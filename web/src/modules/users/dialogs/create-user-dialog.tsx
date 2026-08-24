import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { createUserSchema } from '@/types/user'
import { UserFormDialog } from './user-form-dialog'

export function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' />}>
        <Plus />
        Novo usuário
      </DialogTrigger>
      <UserFormDialog
        title='Criar usuário'
        description='Adicione uma conta de usuário com e-mail e senha.'
        submitLabel='Criar usuário'
        onSubmit={async (values) => {
          const payload = createUserSchema.safeParse(values)
          if (!payload.success) return payload.error.issues[0]?.message

          const result = await writer('POST /users', { body: payload.data, silent: true })
          if (!result.ok) return result.error.friendlyMessage ?? result.error.message

          toast.success('Usuário criado')
          setOpen(false)
          onCreated()
          return undefined
        }}
      />
    </Dialog>
  )
}

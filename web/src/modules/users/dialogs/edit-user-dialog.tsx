import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Dialog } from '@/components/ui/dialog'
import type { User } from '@/types/user'
import { UserFormDialog } from './user-form-dialog'

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UserFormDialog
        title='Editar usuário'
        description='Atualize os dados básicos da conta.'
        submitLabel='Salvar alterações'
        user={user}
        onSubmit={async (values) => {
          const result = await writer('PATCH /users/:id', {
            params: { id: user.id },
            body: { name: values.name, email: values.email },
            silent: true,
          })
          if (!result.ok) return result.error.friendlyMessage ?? result.error.message

          toast.success('Usuário atualizado')
          onOpenChange(false)
          onUpdated()
          return undefined
        }}
      />
    </Dialog>
  )
}

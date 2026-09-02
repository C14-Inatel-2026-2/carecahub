import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Dialog } from '@/components/ui/dialog'
import type { User, UserRole } from '@/types/user'
import { updateUserSchema } from '@/types/user'
import { UserFormDialog } from './user-form-dialog'

export function EditUserDialog({
  user,
  open,
  requesterRole,
  onOpenChange,
  onUpdated,
}: {
  user: User
  open: boolean
  requesterRole: UserRole
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UserFormDialog
        title='Editar usuário'
        description='Atualize os dados básicos da conta.'
        submitLabel='Salvar alterações'
        requesterRole={requesterRole}
        user={user}
        onSubmit={async (values) => {
          const payload = updateUserSchema.safeParse(values)
          if (!payload.success) return payload.error.issues[0]?.message

          const result = await writer('PATCH /users/:id', {
            params: { id: user.id },
            body: payload.data,
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

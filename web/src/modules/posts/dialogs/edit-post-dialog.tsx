import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Dialog } from '@/components/ui/dialog'
import type { Post } from '@/types/post'
import { PostFormDialog } from './post-form-dialog'

export function EditPostDialog({
  post,
  open,
  onOpenChange,
  onUpdated,
}: {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PostFormDialog
        title='Editar post'
        description='Atualize o conteúdo da publicação.'
        submitLabel='Salvar alterações'
        defaultValues={{ title: post.title, content: post.content }}
        onSubmit={async (values) => {
          const result = await writer('PATCH /posts/:id', {
            params: { id: post.id },
            body: values,
            silent: true,
          })
          if (!result.ok) return result.error.friendlyMessage ?? result.error.message

          toast.success('Post atualizado')
          onOpenChange(false)
          onUpdated()
          return undefined
        }}
      />
    </Dialog>
  )
}

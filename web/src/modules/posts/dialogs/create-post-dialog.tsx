import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { PostFormDialog } from './post-form-dialog'

export function CreatePostDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type='button' />}>
        <Plus />
        Novo post
      </DialogTrigger>
      <PostFormDialog
        title='Criar post'
        description='Publique um post na sua conta.'
        submitLabel='Publicar'
        onSubmit={async (values) => {
          const result = await writer('POST /posts', { body: values, silent: true })
          if (!result.ok) return result.error.friendlyMessage ?? result.error.message

          toast.success('Post criado')
          setOpen(false)
          onCreated()
          return undefined
        }}
      />
    </Dialog>
  )
}

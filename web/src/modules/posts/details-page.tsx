import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGet } from '@/api'
import { Button } from '@/components/ui/button'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { EditPostDialog } from './dialogs/edit-post-dialog'

export function PostDetailsPage() {
  const { id } = useParams()
  const user = useUser((state) => state.user)
  const { data: post, error, isLoading, mutate } = useGet('/posts/:id', id)
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <main className='p-6'>Carregando…</main>
  if (error || !post) return <main className='p-6'>Post não encontrado.</main>

  const canEdit = user?.role === 'admin' || user?.id === post.userId

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='mb-6 flex items-center justify-between gap-3'>
        <Button variant='outline' nativeButton={false} render={<Link to={appRoutes.posts} />}>
          <ArrowLeft />
          Voltar para posts
        </Button>
        {canEdit && (
          <Button type='button' onClick={() => setEditOpen(true)}>
            <Pencil />
            Editar post
          </Button>
        )}
      </div>
      <article className='w-full rounded-xl border bg-card p-6 shadow-xs'>
        <p className='text-sm text-muted-foreground'>{post.authorName}</p>
        <h1 className='mt-2 text-2xl font-semibold'>{post.title}</h1>
        <p className='mt-6 whitespace-pre-wrap leading-7'>{post.content}</p>
      </article>
      {canEdit && (
        <EditPostDialog
          post={post}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdated={() => void mutate()}
        />
      )}
    </section>
  )
}

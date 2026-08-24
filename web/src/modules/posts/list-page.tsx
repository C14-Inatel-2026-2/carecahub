import { FileText, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { type ColumnDef, DataTable } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { postPath } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { Post } from '@/types/post'
import { CreatePostDialog } from './dialogs/create-post-dialog'

export function PostsListPage() {
  const navigate = useNavigate()
  const user = useUser((state) => state.user)
  const {
    data: posts,
    isLoading: isLoadingPosts,
    mutate,
  } = useList({
    endpoint: '/posts',
    params: { take: 100 },
    disabled: !user,
  })
  const [search, setSearch] = useState('')
  const columns: ColumnDef<Post>[] = [
    {
      header: 'Título',
      accessorKey: 'title',
      sortable: true,
      cell: (post) => <span className='font-medium'>{post.title}</span>,
    },
    { header: 'Autor', accessorKey: 'authorName', sortable: true },
    {
      header: 'Conteúdo',
      accessorKey: 'content',
      cell: (post) => <span className='line-clamp-2 max-w-xl'>{post.content}</span>,
    },
  ]

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-lg font-medium'>Publicações</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>Leia e publique posts.</p>
        </div>
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          <label htmlFor='posts-search' className='relative min-w-0 flex-1 sm:w-72 sm:flex-none'>
            <span className='sr-only'>Buscar posts</span>
            <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted' />
            <Input
              id='posts-search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className='pl-8'
              placeholder='Buscar posts…'
            />
          </label>
          <CreatePostDialog onCreated={() => void mutate()} />
        </div>
      </div>
      <div className='mt-5'>
        <DataTable
          data={posts}
          columns={columns}
          isLoading={isLoadingPosts}
          searchValue={search}
          onSearchChange={setSearch}
          onRowClick={(post) => navigate(postPath(post.id))}
          searchFunction={(post, term) =>
            [post.title, post.content, post.authorName].some((value) =>
              value.toLocaleLowerCase().includes(term.toLocaleLowerCase())
            )
          }
          emptyStateIcon={<FileText className='size-8 text-icon-muted' />}
          emptyStateTitle={search ? 'Nenhum post encontrado' : 'Nenhum post'}
          emptyStateDescription='Crie o primeiro post.'
        />
      </div>
    </section>
  )
}

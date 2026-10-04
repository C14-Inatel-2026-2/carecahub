import { ArrowLeft, UserRound } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useList } from '@/api'
import { ProfileDetails } from '@/components/profile-details'
import { Button } from '@/components/ui/button'
import { findUserByGitHubUsername } from '@/lib/users'
import { isMockAPIEnabled } from '@/mocks/config'
import { mockUsers } from '@/mocks/users'
import type { User } from '@/types/user'

export function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { githubUsername = '' } = useParams()
  const decodedUsername = githubUsername
  const navigationUser = (location.state as { user?: User } | null)?.user
  const selectedNavigationUser =
    navigationUser?.githubName?.toLocaleLowerCase() === decodedUsername.toLocaleLowerCase()
      ? navigationUser
      : undefined
  const { data: apiUsers, isLoading } = useList({
    endpoint: '/users',
    params: { take: 1, search: decodedUsername },
    disabled: isMockAPIEnabled || !decodedUsername || Boolean(selectedNavigationUser),
  })
  const users = selectedNavigationUser
    ? [selectedNavigationUser]
    : isMockAPIEnabled
      ? mockUsers
      : apiUsers
  const user = findUserByGitHubUsername(users, decodedUsername)

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <Button type='button' variant='ghost' onClick={() => navigate(-1)}>
        <ArrowLeft />
        Voltar
      </Button>

      {isLoading && !isMockAPIEnabled ? (
        <p className='mt-8 text-sm text-muted-foreground'>Carregando perfil…</p>
      ) : user ? (
        <ProfileDetails user={user} />
      ) : (
        <div className='mt-8 rounded-lg border bg-card p-8 text-center'>
          <UserRound className='mx-auto size-10 text-muted-foreground' />
          <h1 className='mt-4 text-lg font-medium'>Usuário não encontrado</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Não foi possível encontrar o perfil @{decodedUsername}.
          </p>
        </div>
      )}
    </section>
  )
}

import { BookOpen, ExternalLink, FolderGit2, GraduationCap, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { GitHubIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBadgeClassNamesByRole } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { type User, userRoleLabels } from '@/types/user'

export function ProfileDetails({ user }: { user: User }) {
  const github = user.gitHubDetails
  const createdAt = github?.createdAt ? new Date(github.createdAt) : null
  const joinedAt =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat('pt-BR', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(createdAt)
      : null

  return (
    <div className='mx-auto mt-6 max-w-4xl space-y-5'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-semibold'>{user.name}</h1>
            <Badge className={cn(getBadgeClassNamesByRole(user.role))}>
              {userRoleLabels[user.role]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className='grid gap-5 sm:grid-cols-2'>
            <Detail label='E-mail' value={user.email} icon={<Mail />} />
            <Detail
              label='Matrícula'
              value={user.registration?.toString() ?? 'Não informada'}
              icon={<GraduationCap />}
            />
            <Detail label='Turma' value={user.classroom ?? 'Não informada'} icon={<BookOpen />} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-row justify-between'>
            <h2 className='flex items-center gap-2 text-base'>
              <GitHubIcon /> GitHub
            </h2>
            {joinedAt && (
              <Badge
                variant='default'
                className='bg-foreground/10 px-3 py-4! rounded-r-none -mr-(--card-spacing) text-sm text-white'
              >
                No GitHub desde {joinedAt}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5 mt-2'>
          {github ? (
            <>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
                {github.avatarUrl && (
                  <img
                    src={github.avatarUrl}
                    alt={`Avatar de ${github.login} no GitHub`}
                    className='size-40 rounded-full border object-cover'
                  />
                )}
                <div className='min-w-0 space-y-3'>
                  <p className='break-all font-medium'>@{github.login}</p>
                  <p className='text-sm text-muted-foreground'>
                    {github.bio || 'Este usuário não possui uma biografia pública no GitHub.'}
                  </p>
                  {github.profileUrl && (
                    <Button
                      variant='outline'
                      render={<a href={github.profileUrl} target='_blank' rel='noreferrer' />}
                    >
                      Ver perfil no GitHub <ExternalLink />
                    </Button>
                  )}
                </div>
              </div>
              {github.publicRepos != null && (
                <dl className='border-t pt-4'>
                  <Detail
                    label='Repositórios públicos'
                    value={github.publicRepos.toLocaleString('pt-BR')}
                    icon={<FolderGit2 />}
                  />
                </dl>
              )}
            </>
          ) : (
            <div className='space-y-2'>
              {user.githubName && <p className='break-all font-medium'>@{user.githubName}</p>}
              <p className='text-sm text-muted-foreground'>
                {user.githubName
                  ? 'Não foi possível carregar os dados do GitHub.'
                  : 'Conta do GitHub não informada.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className='flex items-center gap-3'>
      <span className='text-muted-foreground [&>svg]:size-5'>{icon}</span>
      <div className='min-w-0'>
        <dt className='text-xs text-muted-foreground'>{label}</dt>
        <dd className='wrap-break-word text-sm font-medium'>{value}</dd>
      </div>
    </div>
  )
}

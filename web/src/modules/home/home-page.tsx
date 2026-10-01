import { Navigate } from 'react-router-dom'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { canViewPlatformDashboard, PlatformDashboard } from './platform-dashboard'

export function HomePage() {
  const user = useUser((state) => state.user)

  if (!user) {
    return <Navigate to={appRoutes.login} />
  }

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-lg font-medium'>Bem-vindo(a), {user.name}!</h1>
          {canViewPlatformDashboard(user.role) && (
            <p className='mt-0.5 text-xs text-muted-foreground'>
              Visão geral de uso e atividade da plataforma.
            </p>
          )}
        </div>
      </div>
      {canViewPlatformDashboard(user.role) && <PlatformDashboard />}
    </section>
  )
}

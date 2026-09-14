import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import { Navigate } from "react-router-dom";

export function ProfilePage() {
  const user = useUser((state) => state.user);

  if (!user) {
    return <Navigate to={appRoutes.login} replace />;
  }

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Meu Perfil</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visualize e gerencie suas informações pessoais.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium text-foreground">{user.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>
    </section>
  );
}

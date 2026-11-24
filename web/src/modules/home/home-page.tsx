import { Navigate } from "react-router-dom";
import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";

export function HomePage() {
  const user = useUser((state) => state.user);

  if (!user) {
    return <Navigate to={appRoutes.login} />;
  }

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-lg font-medium">Bem-vindo(a), {user.name}!</h1>
        <div className="flex w-full items-center gap-2 sm:w-auto"></div>
      </div>
    </section>
  );
}

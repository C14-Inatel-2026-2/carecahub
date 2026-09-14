import { ArrowLeft, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { fetcher } from "@/api";
import { ProfileDetails } from "@/components/profile-details";
import { Button } from "@/components/ui/button";
import { useUser } from "@/stores/use-user";
import type { User } from "@/types/user";

export function MyProfilePage() {
  const loggedUser = useUser((state) => state.user);
  const navigate = useNavigate();
  const {
    data: user,
    isLoading,
    error,
  } = useSWR<User>(
    loggedUser?.id ? { url: `/users/${loggedUser.id}` } : null,
    fetcher<User>,
  );

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Voltar
      </Button>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando perfil…</p>
      ) : error ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          Não foi possível carregar seu perfil. Tente novamente mais tarde.
        </p>
      ) : user ? (
        <ProfileDetails user={user} />
      ) : (
        <div className="mt-8 rounded-lg border bg-card p-8 text-center">
          <UserRound className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-lg font-medium">Usuário não encontrado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Não foi possível encontrar seu perfil.
          </p>
        </div>
      )}
    </section>
  );
}

import { mockStudents } from "@/mocks/users";
import { UserCard } from "./components/user-card";
import { InviteUserCard } from "./components/invite-user-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function MyProjectPage() {
  const mockUsersSlice = mockStudents.slice(0, 5);

  return (
    <section className="flex flex-1 flex-col w-full px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Meu Projeto</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Gerencie seu projeto no CarecaHub.
      </p>

      <p className="w-full border border-gray-600 mt-7" />

      <div className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-lg font-medium">Meu Grupo</h1>
          {mockUsersSlice.length > 0 && (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
              <UserCard
                isCurrentUser={true}
                isGroupLeader={true}
                key={mockUsersSlice[0].id}
                user={mockUsersSlice[0]}
              />
              {mockUsersSlice
                .filter((user) => user.id !== "mock-student-01")
                .map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              {mockUsersSlice.length < 6 && <InviteUserCard />}
            </div>
          )}
        </div>
      </div>

      {/* <p className="w-full border border-gray-600 mt-4" /> */}
      <h1 className="mt-7 text-lg font-medium">Dados do Projeto</h1>
      <div className="flex-1">
        <div className="flex w-full h-full flex-col gap-4 items-center justify-center">
          <span>Você ainda não possui projeto cadastrado na plataforma.</span>
          <Button type="button" onClick={() => toast("Criando novo projeto…")}>
            <Plus />
            Criar projeto
          </Button>
        </div>
      </div>
    </section>
  );
}

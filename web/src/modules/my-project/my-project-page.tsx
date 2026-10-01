import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGet } from "@/api";
import { writer } from "@/api/writer";
import { Button } from "@/components/ui/button";
import { isMockAPIEnabled } from "@/mocks/config";
import { mockStudents } from "@/mocks/users";
import { CreateGroupDialog } from "@/modules/groups/dialogs/create-group-dialog";
import { canPromoteGroupLeader } from "@/modules/groups/group-permissions";
import { ProjectCard } from "@/modules/projects/components/project-card";
import { appRoutes, profileRoute } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import type { Group } from "@/types/group";
import { UserCard } from "./components/user-card";
import { InviteUserDialog } from "./dialogs/invite-user-dialog";
import { RepositoryDialog } from "./dialogs/repository-dialog";
import { toast } from "sonner";

export function MyProjectPage() {
  const navigate = useNavigate();
  const user = useUser((state) => state.user);
  const {
    data: group,
    isLoading,
    mutate,
  } = useGet("/groups/:id", user?.groupId);

  if (isMockAPIEnabled) return <MockMyProjectPage />;
  if (isLoading) {
    return (
      <p className="w-full p-6 text-sm text-muted-foreground">
        Carregando seu grupo…
      </p>
    );
  }

  async function promote(selectedGroup: Group, leaderId: string) {
    const result = await writer("PATCH /groups/:id/leader", {
      params: { id: selectedGroup.id },
      body: { leaderId },
      onSuccessMessage: "Novo líder definido",
    });
    if (result.ok) void mutate();
  }

  async function removeMemberFromGroup(
    selectedGroup: Group,
    removedMemberId: string,
  ) {
    if (user?.id !== selectedGroup.leaderId) {
      toast.error("Apenas o líder do grupo pode remover membros.");
      return;
    }

    const result = await writer("DELETE /groups/:id/users/:userId", {
      params: { id: selectedGroup.id, userId: removedMemberId },
      onSuccessMessage: "Membro removido com sucesso.",
    });
    if (result.ok) void mutate();
  }

  async function removeRepository(repositoryId: string) {
    const result = await writer("DELETE /repositories/:id", {
      params: { id: repositoryId },
      onSuccessMessage: "Repositório removido",
    });
    if (result.ok) void mutate();
  }

  return (
    <section className="flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Meu Projeto</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Gerencie seu projeto no CarecaHub.
      </p>
      <div className="mt-7 border-t pt-7">
        {!group ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p>Você ainda não participa de um grupo.</p>
            <CreateGroupDialog onCreated={() => void mutate()} />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-medium">{group.friendlyId}</h2>
            <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((member) => (
                <UserCard
                  key={member.id}
                  user={member}
                  groupLeaderId={group.leaderId}
                  isCurrentUser={member.id === user?.id}
                  isGroupLeader={member.id === group.leaderId}
                  onViewProfile={
                    member.githubName
                      ? () =>
                          navigate(profileRoute(member.githubName as string), {
                            state: { user: member },
                          })
                      : undefined
                  }
                  onPromote={
                    user &&
                    member.id !== group.leaderId &&
                    canPromoteGroupLeader(user, group)
                      ? () => void promote(group, member.id)
                      : undefined
                  }
                  onRemove={() => void removeMemberFromGroup(group, member.id)}
                />
              ))}
              {group.members.length < 6 && group.leaderId === user?.id && (
                <InviteUserDialog />
              )}
            </div>

            <h2 className="mt-8 text-lg font-medium">Dados do Projeto</h2>
            <div className="mt-4">
              {group.project ? (
                <div className="grid gap-5">
                  <div className="max-w-xl">
                    <ProjectCard group={group} />
                  </div>
                  <div className="rounded-lg border bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-medium">Repositórios do projeto</h3>
                      {(group.project.repositoryType === "multirepo" ||
                        group.project.repositories.length === 0) && (
                        <RepositoryDialog
                          group={group}
                          onSaved={() => void mutate()}
                        />
                      )}
                    </div>
                    <div className="mt-4 grid gap-2">
                      {group.project.repositories.map((repository) => (
                        <div
                          key={repository.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <a
                            className="min-w-0 truncate text-sm hover:underline"
                            href={repository.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {repository.url}
                          </a>
                          <div className="flex gap-2">
                            <RepositoryDialog
                              group={group}
                              repository={repository}
                              onSaved={() => void mutate()}
                            />
                            {(user?.role === "admin" ||
                              user?.id === group.leaderId) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeRepository(repository.id)}
                              >
                                <Trash2 /> Excluir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {group.project.repositories.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum repositório cadastrado.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-16">
                  <p>O grupo ainda não possui projeto cadastrado.</p>
                  <Button
                    type="button"
                    onClick={() => navigate(appRoutes.createMyProject)}
                  >
                    <Plus /> Criar projeto
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function MockMyProjectPage() {
  const navigate = useNavigate();
  const mockUsersSlice = mockStudents.slice(0, 5);
  return (
    <section className="flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Meu Projeto</h1>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockUsersSlice.map((mockUser, index) => (
          <UserCard
            key={mockUser.id}
            user={mockUser}
            isCurrentUser={index === 0}
            isGroupLeader={index === 0}
            onViewProfile={
              mockUser.githubName
                ? () => navigate(profileRoute(mockUser.githubName as string))
                : undefined
            }
          />
        ))}
      </div>
      <Button
        className="mt-8 w-fit"
        type="button"
        onClick={() => navigate(appRoutes.createMyProject)}
      >
        <Plus /> Criar projeto
      </Button>
    </section>
  );
}

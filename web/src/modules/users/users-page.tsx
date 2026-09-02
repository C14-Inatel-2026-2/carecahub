import { Ellipsis, Pencil, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useList } from "@/api";
import { type ColumnDef, DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUser } from "@/stores/use-user";
import { type User, userRoleLabels } from "@/types/user";
import { CreateUserDialog } from "./dialogs/create-user-dialog";
import { DeleteUserDialog } from "./dialogs/delete-user-dialog";
import { EditUserDialog } from "./dialogs/edit-user-dialog";

export function UsersPage() {
  const user = useUser((state) => state.user);

  const getVisibleRoles = (role: User["role"] | undefined) => {
    switch (role) {
      case "admin":
        return ["admin", "teacher", "mentor", "student"];
      case "teacher":
        return ["mentor", "student"];
      case "mentor":
        return ["student"];
      default:
        return [];
    }
  };

  const {
    data: users,
    isLoading: isLoadingUsers,
    mutate,
  } = useList({
    endpoint: "/users",
    params: { take: 100, roles: getVisibleRoles(user?.role) },
    disabled: !user || user.role === "student",
  });
  const [search, setSearch] = useState("");
  const columns: ColumnDef<User>[] = [
    {
      header: "Nome",
      accessorKey: "name",
      sortable: true,
      cell: (listedUser) => (
        <span className="font-medium text-foreground">{listedUser.name}</span>
      ),
    },
    { header: "E-mail", accessorKey: "email", sortable: true },
    {
      header: "Função",
      accessorKey: "role",
      sortable: true,
      className: "w-32",
      cell: (listedUser) => userRoleLabels[listedUser.role],
    },
    {
      header: "Status",
      accessorKey: "status",
      className: "w-28",
      cell: (listedUser) => (
        <span className="inline-flex items-center gap-2 text-xs">
          <span
            className={`size-1.5 rounded-full ${listedUser.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"}`}
          />
          {listedUser.status === "active" ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      header: "Ações",
      accessorKey: "actions",
      className: "w-20 text-right",
      cell: (listedUser) =>
        user && (
          <UserActions
            user={listedUser}
            requesterRole={user.role}
            onUpdated={() => void mutate()}
          />
        ),
    },
  ];

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">
            {user?.role === "admin" ? "Usuários" : "Alunos"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gerencie as contas com acesso ao CarecaHub.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label
            htmlFor="users-search"
            className="relative min-w-0 flex-1 sm:w-72 sm:flex-none"
          >
            <span className="sr-only">Buscar usuários</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted" />
            <Input
              id="users-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
              placeholder="Buscar usuários…"
            />
          </label>
          {user && (
            <CreateUserDialog
              requesterRole={user.role}
              onCreated={() => void mutate()}
            />
          )}
        </div>
      </div>

      <div className="mt-5" aria-busy={isLoadingUsers}>
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoadingUsers}
          searchValue={search}
          onSearchChange={setSearch}
          searchFunction={(listedUser, term) => {
            const query = term.toLocaleLowerCase();
            return [listedUser.name, listedUser.email, listedUser.role].some(
              (value) => value.toLocaleLowerCase().includes(query),
            );
          }}
          emptyStateIcon={<Users className="size-8 text-icon-muted" />}
          emptyStateTitle={
            search ? "Nenhum usuário encontrado" : "Nenhum usuário"
          }
          emptyStateDescription={
            search
              ? "Tente outro nome, e-mail ou função."
              : "Crie a primeira conta de usuário."
          }
        />
      </div>
    </section>
  );
}

function UserActions({
  user,
  requesterRole,
  onUpdated,
}: {
  user: User;
  requesterRole: User["role"];
  onUpdated: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Ações para ${user.name}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Editar usuário
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Excluir usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        requesterRole={requesterRole}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onUpdated}
      />
      <DeleteUserDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onUpdated}
      />
    </div>
  );
}

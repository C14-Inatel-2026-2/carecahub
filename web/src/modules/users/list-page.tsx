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
import type { User } from "@/types/user";
import { CreateUserDialog } from "./dialogs/create-user-dialog";
import { DeleteUserDialog } from "./dialogs/delete-user-dialog";
import { EditUserDialog } from "./dialogs/edit-user-dialog";

export function UsersListPage() {
  const user = useUser((state) => state.user);
  const {
    data: users,
    isLoading: isLoadingUsers,
    mutate,
  } = useList({
    endpoint: "/users",
    params: { take: 100 },
    disabled: !user || user.role !== "admin",
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
      className: "w-32 capitalize",
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
      cell: (listedUser) => (
        <UserActions user={listedUser} onUpdated={() => void mutate()} />
      ),
    },
  ];

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Usuários</h1>
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
          <CreateUserDialog onCreated={() => void mutate()} />
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
  onUpdated,
}: {
  user: User;
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

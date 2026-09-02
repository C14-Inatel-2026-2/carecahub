import { ChevronDown, CircleUserRound, KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { writer } from "@/api/writer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChangePasswordDialog } from "@/modules/auth/dialogs/change-password-dialog";
import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import type { LoggedUser } from "@/types/auth";
import { userRoleLabels } from "@/types/user";

type AppHeaderProps = {
  user: LoggedUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  const navigate = useNavigate();
  const clearUser = useUser((state) => state.clearUser);
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function logout() {
    await writer("POST /auth/logout", { body: undefined, silent: true });
    clearUser();
    navigate(appRoutes.login, { replace: true });
  }

  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b bg-card/70 px-3 py-2 md:px-5">
      <SidebarTrigger />
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="ghost" className="font-normal" />
            }
          >
            <CircleUserRound />
            <span className="hidden sm:inline">{user.name}</span>
            <span className="hidden sm:inline">
              {userRoleLabels[user.role]}
            </span>
            <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="block text-foreground">{user.name}</span>
                <span className="block font-normal">{user.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="font-normal"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound />
              Alterar senha
            </DropdownMenuItem>
            <DropdownMenuItem
              className="font-normal"
              onClick={() => void logout()}
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChangePasswordDialog
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
        />
      </div>
    </header>
  );
}

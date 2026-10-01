import {
  CircleUserRound,
  EllipsisVertical,
  Eye,
  UserStar,
  UserX,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types/user";
import { useUser } from "@/stores/use-user";

export function UserCard({
  user,
  groupLeaderId,
  isGroupLeader = false,
  isCurrentUser = false,
  onViewProfile,
  onPromote,
  onRemove,
}: {
  user: User;
  groupLeaderId?: string;
  isGroupLeader?: boolean;
  isCurrentUser?: boolean;
  onViewProfile?: () => void;
  onPromote?: () => void;
  onRemove?: () => void;
}) {
  const loggedUser = useUser((state) => state.user);
  const isLoggedUserLeader =
    loggedUser?.id && groupLeaderId ? loggedUser.id === groupLeaderId : true;

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-gray-500 bg-card p-5 drop-shadow-lg/40 drop-shadow-gray-500">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-row items-center gap-3">
          {user.gitHubDetails?.avatarUrl ? (
            <img
              src={user.gitHubDetails.avatarUrl}
              className="size-8 rounded-full"
            />
          ) : (
            <CircleUserRound className="size-8" />
          )}
          <span className="flex flex-row gap-2">
            {user.name}
            {isCurrentUser && (
              <Badge className="w-fit" variant="default">
                Você
              </Badge>
            )}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Opções para ${user.name}`}
              />
            }
          >
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <UserCardMenuItems
              isLoggedUserLeader={isLoggedUserLeader}
              onViewProfile={onViewProfile}
              onPromote={onPromote}
              onRemove={onRemove}
              showRemoveButton={
                loggedUser?.id ? user.id !== loggedUser?.id : false
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-row items-center justify-between gap-4">
        <a
          href={`https://www.github.com/${user.githubName}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-sm text-white hover:text-muted-foreground hover:underline"
        >
          <GitHubIcon className="size-8 pb-1" />
          <span className="truncate">{user.githubName}</span>
        </a>
        {isGroupLeader && (
          <Badge className="w-fit bg-gray-400 text-black" variant="default">
            Líder
          </Badge>
        )}
      </div>
    </div>
  );
}

export function UserCardMenuItems({
  onViewProfile,
  onPromote,
  onRemove,
  isLoggedUserLeader = false,
  showRemoveButton = false,
}: {
  onViewProfile?: () => void;
  onPromote?: () => void;
  onRemove?: () => void;
  isLoggedUserLeader: boolean;
  showRemoveButton: boolean;
}) {
  return (
    <>
      <DropdownMenuItem
        className="gap-3"
        disabled={!onViewProfile}
        onClick={onViewProfile}
      >
        <Eye />
        Visualizar perfil
      </DropdownMenuItem>
      {onPromote && (
        <DropdownMenuItem className="gap-3" onClick={onPromote}>
          <UserStar />
          Promover a líder
        </DropdownMenuItem>
      )}
      {isLoggedUserLeader && showRemoveButton && (
        <DropdownMenuItem className="gap-3 text-destructive" onClick={onRemove}>
          <UserX />
          Remover do grupo
        </DropdownMenuItem>
      )}
    </>
  );
}

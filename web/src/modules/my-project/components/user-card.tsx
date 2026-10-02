import { CircleUserRound, EllipsisVertical, Eye, UserStar } from "lucide-react";
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

export function UserCard({
  user,
  isGroupLeader = false,
  isCurrentUser = false,
  onViewProfile,
  onPromote,
}: {
  user: User;
  isGroupLeader?: boolean;
  isCurrentUser?: boolean;
  onViewProfile?: () => void;
  onPromote?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-gray-500 bg-card p-5 drop-shadow-lg/40 drop-shadow-gray-500">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-row items-center gap-4">
          <CircleUserRound className="size-8" />
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
              onViewProfile={onViewProfile}
              onPromote={onPromote}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4">
          <GitHubIcon className="size-7 pl-1" />
          <span>{user.githubName}</span>
        </div>
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
}: {
  onViewProfile?: () => void;
  onPromote?: () => void;
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
    </>
  );
}

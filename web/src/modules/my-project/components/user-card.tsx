import { GitHubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/user";
import { CircleUserRound } from "lucide-react";

export function UserCard({
  user,
  isGroupLeader = false,
  isCurrentUser = false,
}: {
  user: User;
  isGroupLeader?: boolean;
  isCurrentUser?: boolean;
}) {
  return (
    <div className="flex flex-col p-5 gap-2 bg-card rounded-sm drop-shadow-lg/40 drop-shadow-gray-500 border border-gray-500">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4">
          <CircleUserRound className="size-8" />
          <span>{user.name}</span>
        </div>
        {isGroupLeader && (
          <Badge className="w-fit bg-gray-400 text-black" variant="default">
            Líder
          </Badge>
        )}
      </div>

      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4">
          <GitHubIcon className="size-7 pl-1" />
          <span>{user.githubName}</span>
        </div>
        {isCurrentUser && (
          <Badge className="w-fit" variant="default">
            Você
          </Badge>
        )}
      </div>
    </div>
  );
}

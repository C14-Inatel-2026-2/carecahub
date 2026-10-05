import {
  CircleUserRound,
  EllipsisVertical,
  Eye,
  Trash2,
  UserStar,
} from "lucide-react";
import { useState } from "react";
import { GitHubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onRemove,
}: {
  user: User;
  isGroupLeader?: boolean;
  isCurrentUser?: boolean;
  onViewProfile?: () => void;
  onPromote?: () => void;
  onRemove?: () => Promise<boolean>;
}) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function removeMember() {
    if (!onRemove) return;
    setIsRemoving(true);
    const removed = await onRemove();
    setIsRemoving(false);
    if (removed) setRemoveOpen(false);
  }

  return (
    <>
      <Card className="ring-0 flex flex-col gap-2 rounded-sm border border-border bg-card p-5 drop-shadow-lg/40 drop-shadow-foreground/10">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-row items-center gap-4">
            {user.gitHubDetails?.avatarUrl ? (
              <img
                src={user.gitHubDetails.avatarUrl}
                alt={user.name}
                className="size-8 rounded-full"
              />
            ) : (
              <CircleUserRound className="size-8 text-highlight-soft-foreground" />
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
                onViewProfile={onViewProfile}
                onPromote={onPromote}
                onRemove={onRemove ? () => setRemoveOpen(true) : undefined}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-row items-center justify-between gap-4">
          <a
            href={`https://github.com/${user.githubName}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-4 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <GitHubIcon className="size-8" />
            <span className="truncate">{user.githubName}</span>
          </a>
          {isGroupLeader && (
            <Badge
              className="w-fit bg-highlight-soft text-highlight-soft-foreground"
              variant="default"
            >
              Líder
            </Badge>
          )}
        </div>
      </Card>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {user.name} do grupo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={isRemoving}
              onClick={() => void removeMember()}
            >
              <Trash2 />
              {isRemoving ? "Removendo…" : "Remover membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function UserCardMenuItems({
  onViewProfile,
  onPromote,
  onRemove,
}: {
  onViewProfile?: () => void;
  onPromote?: () => void;
  onRemove?: () => void;
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
      {onRemove && (
        <DropdownMenuItem
          className="gap-3"
          variant="destructive"
          onClick={onRemove}
        >
          <Trash2 />
          Remover membro
        </DropdownMenuItem>
      )}
    </>
  );
}

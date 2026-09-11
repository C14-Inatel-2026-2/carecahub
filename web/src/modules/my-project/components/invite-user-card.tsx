import { Plus } from "lucide-react";

export function InviteUserCard() {
  return (
    <div className="cursor-pointer h-full flex flex-col p-4 gap-2 bg-card rounded-sm items-center justify-center drop-shadow-lg/40 drop-shadow-gray-500 border border-gray-500 transition-all duration-200 hover:border-b-3 hover:border-r-3 active:active:translate-y-0.5">
      <div className="bg-background shadow-[1px_1px_4px_0_var(--color-gray-500)] rounded-full p-2">
        <Plus />
      </div>
      <span>Convidar integrante</span>
    </div>
  );
}

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function handleCreateGroup() {
  toast("Criando novo grupo...", { position: "bottom-left" });
}

export function CreateGroupDialog() {
  return (
    <Button type="button" onClick={handleCreateGroup}>
      {" "}
      <Plus /> Novo Grupo{" "}
    </Button>
  );
}

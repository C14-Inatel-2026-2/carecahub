import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { handleCreateGroup } from "../src/modules/groups/dialogs/create-group-dialog";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

describe("CreateGroupDialog", () => {
  it("should show a toast when creating a group", () => {
    handleCreateGroup();

    expect(toast).toHaveBeenCalledWith("Criando novo grupo...", {
      position: "bottom-left",
    });
  });
});
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoggedUser } from "@/types/auth";
import type { Group } from "@/types/group";
import { GroupsPage } from "./groups-page";

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  writer: vi.fn(),
  mutate: vi.fn(),
  user: null as LoggedUser | null,
  cardProps: undefined as
    | {
        showOptions?: boolean;
        onLeaderChange?: (leaderId: string) => Promise<boolean>;
      }
    | undefined,
}));

vi.mock("@/api", () => ({ useList: mocks.useList }));
vi.mock("@/api/writer", () => ({ writer: mocks.writer }));
vi.mock("@/mocks/config", () => ({ isMockAPIEnabled: false }));
vi.mock("@/stores/use-user", () => ({
  useUser: (selector: (state: { user: LoggedUser | null }) => unknown) =>
    selector({ user: mocks.user }),
}));
vi.mock("@/modules/projects/components/project-card", () => ({
  GroupCard: (props: typeof mocks.cardProps) => {
    mocks.cardProps = props;
    return <div>Grupo</div>;
  },
}));

const group = {
  id: "group-1",
  friendlyId: "Grupo 1",
  leaderId: "leader-1",
  members: [],
  createdAt: "2026-09-29T14:05:00.000Z",
  updatedAt: "2026-09-29T14:05:00.000Z",
} as Group;

function renderAs(user: LoggedUser | null) {
  mocks.user = user;
  renderToStaticMarkup(<GroupsPage />);
}

describe("GroupsPage leader management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cardProps = undefined;
    mocks.useList.mockReturnValue({
      data: [group],
      isLoading: false,
      mutate: mocks.mutate,
    });
  });

  it("updates the selected leader and refreshes groups after success", async () => {
    mocks.writer.mockResolvedValue({ ok: true, data: undefined });
    renderAs({ id: "admin-1", role: "admin" } as LoggedUser);

    const changed = await mocks.cardProps?.onLeaderChange?.("member-1");

    expect(mocks.cardProps?.showOptions).toBe(true);
    expect(mocks.writer).toHaveBeenCalledWith("PATCH /groups/:id/leader", {
      params: { id: "group-1" },
      body: { leaderId: "member-1" },
      onSuccessMessage: "Novo líder definido",
    });
    expect(mocks.mutate).toHaveBeenCalledOnce();
    expect(changed).toBe(true);
  });

  it("does not refresh groups when changing the leader fails", async () => {
    mocks.writer.mockResolvedValue({ ok: false, error: { message: "Falha" } });
    renderAs({ id: "leader-1", role: "student" } as LoggedUser);

    const changed = await mocks.cardProps?.onLeaderChange?.("member-1");

    expect(mocks.cardProps?.showOptions).toBe(true);
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(changed).toBe(false);
  });

  // TODO: Fix this test for most accurate showOptions treatment based on role
  // it.each([
  //   ["ordinary member", { id: "member-1", role: "student" } as LoggedUser],
  //   ["teacher", { id: "teacher-1", role: "teacher" } as LoggedUser],
  //   ["mentor", { id: "mentor-1", role: "mentor" } as LoggedUser],
  //   ["signed-out user", null],
  // ])("hides management options from %s", (_case, user) => {
  //   renderAs(user);

  //   expect(mocks.cardProps?.showOptions).toBe(false);
  // });
});

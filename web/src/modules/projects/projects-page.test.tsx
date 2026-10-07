import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Group } from "@/types/group";
import { ProjectsPage } from "./projects-page";

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  useDebounce: vi.fn(() => "busca atrasada"),
}));

vi.mock("@/api", () => ({ useList: mocks.useList }));
vi.mock("@/lib/use-debounce", () => ({ useDebounce: mocks.useDebounce }));
vi.mock("@/mocks/config", () => ({ isMockAPIEnabled: false }));

const projectGroup: Group = {
  id: "group-with-project",
  friendlyId: "Grupo com projeto",
  leaderId: "leader-1",
  members: [],
  createdAt: "2026-09-29T14:05:00.000Z",
  updatedAt: "2026-09-29T14:05:00.000Z",
  project: {
    id: "project-1",
    projectName: "CarecaHub",
    commitCount: 20,
    branchCount: 3,
    repositories: [],
    createdAt: "2026-09-29T14:05:00.000Z",
    updatedAt: "2026-09-29T14:05:00.000Z",
  },
};

const projectlessGroup: Group = {
  id: "group-without-project",
  friendlyId: "Grupo sem projeto",
  leaderId: "leader-2",
  members: [],
  project: null,
  createdAt: "2026-09-29T14:05:00.000Z",
  updatedAt: "2026-09-29T14:05:00.000Z",
};

function renderPage(groups: Group[]) {
  mocks.useList.mockReturnValue({ data: groups, isLoading: false });

  return renderToStaticMarkup(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  );
}

describe("ProjectsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("separates project cards and projectless group cards into named sections", () => {
    const html = renderPage([projectlessGroup, projectGroup]);

    expect(html).toContain("Projetos");
  });

  it("renders a project search field and sends the project search scope", () => {
    const html = renderPage([]);

    expect(html).toContain(
      'placeholder="Buscar projetos, repositórios ou membros…"',
    );
    expect(mocks.useList).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/groups",
        params: expect.objectContaining({
          search: "busca atrasada",
          searchScope: "projects",
        }),
      }),
    );
    expect(mocks.useDebounce).toHaveBeenCalledWith("", 350);
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Project } from "@/types/project";
import { ProjectDetailsContent } from "./project-details-page";

const project: Project = {
  id: "project-1",
  groupId: "group-1",
  projectName: "CarecaHub",
  description: "Plataforma para acompanhar os projetos da disciplina.",
  technologies: ["react", "typescript"],
  usesOtherTechnology: true,
  otherTechnology: "Tailwind CSS",
  dependencyManager: "pnpm",
  versionControl: "git",
  repositoryType: "monorepo",
  repositories: [
    {
      id: "repository-1",
      url: "https://github.com/acme/carecahub",
      ownerId: "user-1",
      projectId: "project-1",
      commitCount: 42,
      branchCount: 4,
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-30T10:00:00.000Z",
    },
  ],
  commitCount: 42,
  branchCount: 4,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-30T10:00:00.000Z",
};

describe("ProjectDetailsContent", () => {
  it("renders the project information from the details endpoint", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailsContent project={project} />,
    );

    expect(html).toContain("CarecaHub");
    expect(html).toContain(
      "Plataforma para acompanhar os projetos da disciplina.",
    );
    expect(html).toContain("React");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Tailwind CSS");
    expect(html).toContain("Monorepo");
    expect(html).toContain("pnpm");
    expect(html).toContain("Git");
    expect(html).toMatch(/Commits[\s\S]*42/);
    expect(html).toMatch(/Branches[\s\S]*4/);
    expect(html).toContain('href="https://github.com/acme/carecahub"');
    expect(html).toContain('alt="Imagem do projeto CarecaHub"');
  });

  it("keeps project editing unavailable in this version", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailsContent project={project} />,
    );

    expect(html).not.toContain('aria-label="Editar projeto"');
    expect(html).not.toContain('disabled=""');
  });

  it("shows saved appearance and a customization link to a group member", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProjectDetailsContent
          project={{
            ...project,
            iconUrl: "https://example.com/icon.png",
            thumbnailUrl: "https://example.com/thumbnail.png",
            mainColor: "#123ABC",
          }}
          canCustomize
        />
      </MemoryRouter>,
    );

    expect(html).toContain('src="https://example.com/icon.png"');
    expect(html).toContain('src="https://example.com/thumbnail.png"');
    expect(html).toContain("color:#123ABC");
    expect(html).toContain(
      "background:linear-gradient(to right, var(--card) 0%, var(--card) 70%, #123ABC 100%)",
    );
    expect(html).toContain('href="/projects/project-1/customize"');
  });

  it("renders group members with GitHub avatars and a user fallback", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailsContent
        project={
          {
            ...project,
            members: [
              {
                id: "user-1",
                groupId: "group-1",
                name: "Ada Lovelace",
                registration: 1,
                githubName: "ada",
                classroom: "A1",
                email: "ada@example.com",
                role: "student",
                status: "active",
                twoFactor: false,
                createdAt: "2026-09-01T10:00:00.000Z",
                updatedAt: "2026-09-01T10:00:00.000Z",
                gitHubDetails: {
                  login: "ada",
                  avatarUrl: "https://avatars.githubusercontent.com/u/1",
                  profileUrl: "https://github.com/ada",
                  bio: null,
                  createdAt: "2020-01-01T00:00:00.000Z",
                  publicRepos: 1,
                },
              },
              {
                id: "user-2",
                groupId: "group-1",
                name: "Grace Hopper",
                registration: 2,
                githubName: null,
                classroom: "A1",
                email: "grace@example.com",
                role: "student",
                status: "active",
                twoFactor: false,
                createdAt: "2026-09-01T10:00:00.000Z",
                updatedAt: "2026-09-01T10:00:00.000Z",
              },
            ],
          } as Project
        }
      />,
    );

    expect(html).toContain("Grupo");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Grace Hopper");
    expect(html).toContain('src="https://avatars.githubusercontent.com/u/1"');
    expect(html).toContain("lucide-circle-user");
    expect(html).toContain("grid-template-columns:repeat(1, minmax(0, 1fr))");
    expect(html).toContain("grid-template-rows:repeat(2, minmax(0, auto))");
  });

  it.each([
    [1, 1, 1],
    [3, 1, 3],
    [4, 2, 2],
    [5, 2, 3],
    [6, 2, 3],
  ])(
    "uses %i columns and %i rows for %i group members",
    (count, columns, rows) => {
      const html = renderToStaticMarkup(
        <ProjectDetailsContent
          project={
            {
              ...project,
              members: Array.from({ length: count }, (_, index) => ({
                id: `user-${index}`,
                name: `Member ${index + 1}`,
              })),
            } as Project
          }
        />,
      );

      expect(html).toContain(
        `grid-template-columns:repeat(${columns}, minmax(0, 1fr))`,
      );
      expect(html).toContain(
        `grid-template-rows:repeat(${rows}, minmax(0, auto))`,
      );
    },
  );
});

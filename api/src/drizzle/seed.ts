import "dotenv/config";

import { groups, projects, repositories, users } from "@db";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";

import { hashPassword } from "@/utils/password";

const seedEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SEED_ADMIN_PASSWORD: z.string().min(1, "SEED_ADMIN_PASSWORD is required"),
  SEED_USER_PASSWORD: z.string().min(1, "SEED_USER_PASSWORD is required"),
});

export function getSeedConfig(environment: Record<string, string | undefined>) {
  const parsed = seedEnvSchema.parse(environment);

  return {
    databaseUrl: parsed.DATABASE_URL,
    adminPassword: parsed.SEED_ADMIN_PASSWORD,
    userPassword: parsed.SEED_USER_PASSWORD,
  };
}

const seedIds = {
  admin: "00000000-0000-4000-8000-000000000001",

  student1: "00000000-0000-4000-8000-000000000002",
  student2: "00000000-0000-4000-8000-000000000003",
  student3: "00000000-0000-4000-8000-000000000004",
  student4: "00000000-0000-4000-8000-000000000005",
  student5: "00000000-0000-4000-8000-000000000006",
  student6: "00000000-0000-4000-8000-000000000007",
  student7: "00000000-0000-4000-8000-000000000008",
  student8: "00000000-0000-4000-8000-000000000009",
  student9: "00000000-0000-4000-8000-000000000010",
  student10: "00000000-0000-4000-8000-000000000011",
  student11: "00000000-0000-4000-8000-000000000012",
  student12: "00000000-0000-4000-8000-000000000013",
  student13: "00000000-0000-4000-8000-000000000014",
  student14: "00000000-0000-4000-8000-000000000015",
  student15: "00000000-0000-4000-8000-000000000016",
  student16: "00000000-0000-4000-8000-000000000017",
  student17: "00000000-0000-4000-8000-000000000018",
  student18: "00000000-0000-4000-8000-000000000019",

  mentor1: "00000000-0000-4000-8000-000000000020",
  mentor2: "00000000-0000-4000-8000-000000000021",

  group1: "00000000-0000-4000-8000-000000000022",
  group2: "00000000-0000-4000-8000-000000000023",
  group3: "00000000-0000-4000-8000-000000000024",
  group4: "00000000-0000-4000-8000-000000000025",
  group5: "00000000-0000-4000-8000-000000000026",
  group6: "00000000-0000-4000-8000-000000000027",

  project1: "00000000-0000-4000-8000-000000000028",
  project2: "00000000-0000-4000-8000-000000000029",
  project3: "00000000-0000-4000-8000-000000000030",
  project4: "00000000-0000-4000-8000-000000000031",
  project5: "00000000-0000-4000-8000-000000000032",
  project6: "00000000-0000-4000-8000-000000000033",

  repository1: "00000000-0000-4000-8000-000000000034",
  repository2: "00000000-0000-4000-8000-000000000035",
  repository3: "00000000-0000-4000-8000-000000000036",
  repository4: "00000000-0000-4000-8000-000000000037",
  repository5: "00000000-0000-4000-8000-000000000038",
  repository6: "00000000-0000-4000-8000-000000000039",
} as const;

const studentsSeed = [
  {
    id: seedIds.student1,
    name: "Felipe Soares",
    registration: 123,
    githubName: "Felipe-SSS",
    classroom: "A",
    email: "felipe@carecahub.local",
  },
  {
    id: seedIds.student2,
    name: "Daniel Granato",
    registration: 124,
    githubName: "Granato07",
    classroom: "A",
    email: "daniel@carecahub.local",
  },
  {
    id: seedIds.student3,
    name: "Isabelle Caroline",
    registration: 125,
    githubName: "isacarol-04",
    classroom: "A",
    email: "isabelle@carecahub.local",
  },
  {
    id: seedIds.student4,
    name: "Pedro Henrique Santos",
    registration: 126,
    githubName: "HSOPedro",
    classroom: "A",
    email: "pedro@carecahub.local",
  },
  {
    id: seedIds.student5,
    name: "Rander Lemos",
    registration: 127,
    githubName: "RanderDLemos",
    classroom: "A",
    email: "rander@carecahub.local",
  },
  {
    id: seedIds.student6,
    name: "Lara Siécola",
    registration: 128,
    githubName: "lara-ms",
    classroom: "A",
    email: "lara@carecahub.local",
  },
  {
    id: seedIds.student7,
    name: "Lucas Oliveira",
    registration: 129,
    githubName: "lucasoliveira-dev",
    classroom: "A",
    email: "lucas@carecahub.local",
  },
  {
    id: seedIds.student8,
    name: "Mariana Costa",
    registration: 130,
    githubName: "marianacosta-dev",
    classroom: "A",
    email: "mariana@carecahub.local",
  },
  {
    id: seedIds.student9,
    name: "Gabriel Almeida",
    registration: 131,
    githubName: "gabrielalmeida-dev",
    classroom: "A",
    email: "gabriel@carecahub.local",
  },

  {
    id: seedIds.student10,
    name: "Ana Beatriz",
    registration: 132,
    githubName: "anabeatriz-dev",
    classroom: "B",
    email: "ana@carecahub.local",
  },
  {
    id: seedIds.student11,
    name: "João Victor",
    registration: 133,
    githubName: "joaovictor-dev",
    classroom: "B",
    email: "joao@carecahub.local",
  },
  {
    id: seedIds.student12,
    name: "Matheus Ferreira",
    registration: 134,
    githubName: "matheusferreira-dev",
    classroom: "B",
    email: "matheus@carecahub.local",
  },
  {
    id: seedIds.student13,
    name: "Julia Martins",
    registration: 135,
    githubName: "juliamartins-dev",
    classroom: "B",
    email: "julia@carecahub.local",
  },
  {
    id: seedIds.student14,
    name: "Gustavo Rocha",
    registration: 136,
    githubName: "gustavorocha-dev",
    classroom: "B",
    email: "gustavo@carecahub.local",
  },
  {
    id: seedIds.student15,
    name: "Camila Souza",
    registration: 137,
    githubName: "camilasouza-dev",
    classroom: "B",
    email: "camila@carecahub.local",
  },
  {
    id: seedIds.student16,
    name: "Rafael Lima",
    registration: 138,
    githubName: "rafaellima-dev",
    classroom: "B",
    email: "rafael@carecahub.local",
  },
  {
    id: seedIds.student17,
    name: "Eduarda Ribeiro",
    registration: 139,
    githubName: "eduardaribeiro-dev",
    classroom: "B",
    email: "eduarda@carecahub.local",
  },
  {
    id: seedIds.student18,
    name: "Bruno Carvalho",
    registration: 140,
    githubName: "brunocarvalho-dev",
    classroom: "B",
    email: "bruno@carecahub.local",
  },
] as const;

const mentorsSeed = [
  {
    id: seedIds.mentor1,
    name: "Monitor Gabriel",
    registration: 201,
    githubName: "monitor-gabriel",
    classroom: null,
    email: "monitor.gabriel@carecahub.local",
  },
  {
    id: seedIds.mentor2,
    name: "Monitor Amanda",
    registration: 202,
    githubName: "monitor-amanda",
    classroom: null,
    email: "monitor.amanda@carecahub.local",
  },
] as const;

const groupsSeed = [
  {
    id: seedIds.group1,
    friendlyId: "Grupo 1",
    leaderId: seedIds.student1,
    memberIds: [
      seedIds.student1,
      seedIds.student2,
      seedIds.student3,
      seedIds.student4,
      seedIds.student5,
      seedIds.student6,
    ],
  },
  {
    id: seedIds.group2,
    friendlyId: "Grupo 2",
    leaderId: seedIds.student7,
    memberIds: [seedIds.student7, seedIds.student8],
  },
  {
    id: seedIds.group3,
    friendlyId: "Grupo 3",
    leaderId: seedIds.student9,
    memberIds: [seedIds.student9],
  },
  {
    id: seedIds.group4,
    friendlyId: "Grupo 4",
    leaderId: seedIds.student10,
    memberIds: [seedIds.student10, seedIds.student11, seedIds.student12],
  },
  {
    id: seedIds.group5,
    friendlyId: "Grupo 5",
    leaderId: seedIds.student13,
    memberIds: [seedIds.student13, seedIds.student14, seedIds.student15],
  },
  {
    id: seedIds.group6,
    friendlyId: "Grupo 6",
    leaderId: seedIds.student16,
    memberIds: [seedIds.student16, seedIds.student17, seedIds.student18],
  },
] as const;

const projectsSeed = [
  {
    id: seedIds.project1,
    groupId: seedIds.group1,
    projectName: "CarecaHub",
    description:
      "Plataforma para gestão de grupos, projetos e disciplinas de engenharia de software.",
    technologies: ["typescript", "nestjs", "react", "tailwindcss", "vite"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "monorepo" as const,
    repository: {
      id: seedIds.repository1,
      url: "https://github.com/C14-Inatel-2026-2/carecahub",
      ownerId: seedIds.student1,
    },
  },
  {
    id: seedIds.project2,
    groupId: seedIds.group2,
    projectName: "ImobiUAI",
    description: "Projeto para gestão de imóveis de uma imobiliária.",
    technologies: ["typescript", "nestjs", "react", "tailwindcss", "vite"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "multirepo" as const,
    repository: {
      id: seedIds.repository2,
      url: "https://github.com/C14-Inatel-2026-2/imobiuai",
      ownerId: seedIds.student2,
    },
  },
  {
    id: seedIds.project3,
    groupId: seedIds.group3,
    projectName: "SpookStream",
    description: "Plataforma para gerenciamento de conteúdo multimídia.",
    technologies: ["typescript", "nodejs", "react", "postgresql", "docker"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "monorepo" as const,
    repository: {
      id: seedIds.repository3,
      url: "https://github.com/Felipe-SSS/spookstream",
      ownerId: seedIds.student3,
    },
  },
  {
    id: seedIds.project4,
    groupId: seedIds.group4,
    projectName: "ClassTrack",
    description:
      "Sistema para acompanhamento de aulas, atividades e desempenho acadêmico.",
    technologies: ["typescript", "nestjs", "react", "postgresql", "docker"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "monorepo" as const,
    repository: {
      id: seedIds.repository4,
      url: "https://github.com/C14-Inatel-2026-2/class-track",
      ownerId: seedIds.student10,
    },
  },
  {
    id: seedIds.project5,
    groupId: seedIds.group5,
    projectName: "DevMetrics",
    description:
      "Dashboard para análise de métricas de desenvolvimento e produtividade.",
    technologies: ["typescript", "nestjs", "react", "postgresql", "redis"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "multirepo" as const,
    repository: {
      id: seedIds.repository5,
      url: "https://github.com/C14-Inatel-2026-2/dev-metrics",
      ownerId: seedIds.student13,
    },
  },
  {
    id: seedIds.project6,
    groupId: seedIds.group6,
    projectName: "CodeReview Hub",
    description:
      "Plataforma colaborativa para revisão de código e acompanhamento de projetos.",
    technologies: ["typescript", "nestjs", "react", "docker", "postgresql"],
    dependencyManager: "pnpm",
    versionControl: "git",
    repositoryType: "monorepo" as const,
    repository: {
      id: seedIds.repository6,
      url: "https://github.com/C14-Inatel-2026-2/code-review-hub",
      ownerId: seedIds.student16,
    },
  },
] as const;

export async function seed(
  environment: Record<string, string | undefined> = process.env,
) {
  const config = getSeedConfig(environment);

  const [adminPassword, userPassword] = await Promise.all([
    hashPassword(config.adminPassword),
    hashPassword(config.userPassword),
  ]);

  const pool = new Pool({
    connectionString: config.databaseUrl,
  });

  const db = drizzle({ client: pool });

  try {
    await db.transaction(async (tx) => {
      const now = new Date();

      //
      // ADMIN
      //

      const admin = {
        id: seedIds.admin,
        name: "CarecaHub Admin",
        registration: 1000001,
        githubName: "carecahub-admin",
        classroom: null,
        email: "admin@carecahub.local",
        password: adminPassword,
        role: "admin" as const,
        status: "active" as const,
        groupId: null,
        deletedAt: null,
        updatedAt: now,
      };

      await tx.insert(users).values(admin).onConflictDoUpdate({
        target: users.id,
        set: admin,
      });

      //
      // STUDENTS
      //

      for (const student of studentsSeed) {
        const user = {
          ...student,
          groupId: null,
          password: userPassword,
          role: "student" as const,
          status: "active" as const,
          deletedAt: null,
          updatedAt: now,
        };

        await tx.insert(users).values(user).onConflictDoUpdate({
          target: users.id,
          set: user,
        });
      }

      //
      // MENTORS / MONITORES
      //

      for (const mentor of mentorsSeed) {
        const user = {
          ...mentor,
          groupId: null,
          password: userPassword,
          role: "mentor" as const,
          status: "active" as const,
          deletedAt: null,
          updatedAt: now,
        };

        await tx.insert(users).values(user).onConflictDoUpdate({
          target: users.id,
          set: user,
        });
      }

      //
      // GROUPS
      //

      for (const group of groupsSeed) {
        const groupData = {
          id: group.id,
          friendlyId: group.friendlyId,
          leaderId: group.leaderId,
          deletedAt: null,
          updatedAt: now,
        };

        await tx.insert(groups).values(groupData).onConflictDoUpdate({
          target: groups.id,
          set: groupData,
        });

        await tx
          .update(users)
          .set({
            groupId: group.id,
            updatedAt: now,
          })
          .where(inArray(users.id, [...group.memberIds]));
      }

      //
      // PROJECTS
      //

      for (const project of projectsSeed) {
        const projectData = {
          id: project.id,
          groupId: project.groupId,
          projectName: project.projectName,
          description: project.description,
          technologies: [...project.technologies],

          usesOtherTechnology: false,
          otherTechnology: null,

          dependencyManager: project.dependencyManager,
          otherDependencyManager: null,

          versionControl: project.versionControl,
          otherVersionControl: null,

          repositoryType: project.repositoryType,

          deletedAt: null,
          updatedAt: now,
        };

        await tx.insert(projects).values(projectData).onConflictDoUpdate({
          target: projects.id,
          set: projectData,
        });

        const repositoryData = {
          id: project.repository.id,
          url: project.repository.url,
          ownerId: project.repository.ownerId,
          projectId: project.id,
          deletedAt: null,
          updatedAt: now,
        };

        await tx
          .insert(repositories)
          .values(repositoryData)
          .onConflictDoUpdate({
            target: repositories.id,
            set: repositoryData,
          });
      }
    });

    return seedIds;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then((ids) => {
      console.log("Database seed completed.", ids);
    })
    .catch((error) => {
      console.error(
        "Database seed failed:",
        error instanceof Error ? error.message : String(error),
      );

      process.exitCode = 1;
    });
}

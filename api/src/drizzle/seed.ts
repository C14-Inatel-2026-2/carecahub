import "dotenv/config";
import { groups, projects, repositories, users } from "@db";
import { eq } from "drizzle-orm";
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
  project1: "00000000-0000-4000-8000-000000000008",
  repository1: "00000000-0000-4000-8000-000000000009",
  group1: "00000000-0000-4000-8000-000000000010",
  project2: "00000000-0000-4000-8000-000000000011",
  repository2: "00000000-0000-4000-8000-000000000012",
  group2: "00000000-0000-4000-8000-000000000013",
  project3: "00000000-0000-4000-8000-000000000014",
  repository3: "00000000-0000-4000-8000-000000000015",
  group3: "00000000-0000-4000-8000-000000000016",
} as const;

export async function seed(
  environment: Record<string, string | undefined> = process.env,
) {
  const config = getSeedConfig(environment);
  const [adminPassword, userPassword] = await Promise.all([
    hashPassword(config.adminPassword),
    hashPassword(config.userPassword),
  ]);
  const pool = new Pool({ connectionString: config.databaseUrl });
  const db = drizzle({ client: pool });

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: seedIds.admin,
          name: "CarecaHub Admin",
          registration: 1000001,
          githubName: "carecahub-admin",
          classroom: null,
          email: "admin@carecahub.local",
          password: adminPassword,
          role: "admin",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "CarecaHub Admin",
            registration: 1000001,
            githubName: "carecahub-admin",
            classroom: null,
            email: "admin@carecahub.local",
            password: adminPassword,
            role: "admin",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student1,
          name: "Felipe Soares",
          registration: 123,
          githubName: "Felipe-SSS",
          classroom: "A",
          email: "felipe@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Felipe Soares",
            registration: 123,
            githubName: "octocat",
            classroom: "A",
            email: "felipe@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student2,
          name: "Daniel Granato",
          registration: 124,
          githubName: "Granato07",
          classroom: "A",
          email: "daniel@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Daniel Granato",
            registration: 124,
            githubName: "Granato07",
            classroom: "A",
            email: "daniel@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student3,
          name: "Isabelle Caroline",
          registration: 125,
          githubName: "isacarol-04",
          classroom: "A",
          email: "isabelle@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Isabelle Caroline",
            registration: 125,
            githubName: "isacarol-04",
            classroom: "A",
            email: "isabelle@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student4,
          name: "Pedro Henrique Santos",
          registration: 126,
          githubName: "HSOPedro",
          classroom: "A",
          email: "pedro@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Pedro Henrique Santos",
            registration: 126,
            githubName: "isacarol-04",
            classroom: "A",
            email: "pedro@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student5,
          name: "Rander Lemos",
          registration: 127,
          githubName: "RanderDLemos",
          classroom: "A",
          email: "rander@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Rander Lemos",
            registration: 127,
            githubName: "RanderDLemos",
            classroom: "A",
            email: "rander@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(users)
        .values({
          id: seedIds.student6,
          name: "Lara Siécola",
          registration: 128,
          githubName: "lara-ms",
          classroom: "A",
          email: "lara@carecahub.local",
          password: userPassword,
          role: "student",
          status: "active",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: "Lara Siécola",
            registration: 128,
            githubName: "lara-ms",
            classroom: "A",
            email: "lara@carecahub.local",
            password: userPassword,
            role: "student",
            status: "active",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(groups)
        .values({
          id: seedIds.group1,
          friendlyId: "Grupo 1",
          leaderId: seedIds.student1,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: groups.id,
          set: {
            friendlyId: "Grupo 1",
            leaderId: seedIds.student1,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .update(users)
        .set({ groupId: seedIds.group1, updatedAt: new Date() })
        .where(eq(users.id, seedIds.student1));

      await tx
        .insert(projects)
        .values({
          id: seedIds.project1,
          groupId: seedIds.group1,
          projectName: "CarecaHub",
          description:
            "Projeto para gestão das disciplinas da disciplina de engenharia de software.",
          technologies: [
            "typescript",
            "nestjs",
            "react",
            "tailwindcss",
            "vite",
          ],
          usesOtherTechnology: false,
          dependencyManager: "pnpm",
          versionControl: "git",
          repositoryType: "monorepo",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projects.id,
          set: {
            projectName: "CarecaHub",
            groupId: seedIds.group1,
            description:
              "Projeto para gestão das disciplinas da disciplina de engenharia de software.",
            technologies: [
              "typescript",
              "nestjs",
              "react",
              "tailwindcss",
              "vite",
            ],
            usesOtherTechnology: false,
            otherTechnology: null,
            dependencyManager: "pnpm",
            otherDependencyManager: null,
            versionControl: "git",
            otherVersionControl: null,
            repositoryType: "monorepo",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(repositories)
        .values({
          id: seedIds.repository1,
          url: "https://github.com/C14-Inatel-2026-2/carecahub",
          ownerId: seedIds.student1,
          projectId: seedIds.project1,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repositories.id,
          set: {
            url: "https://github.com/C14-Inatel-2026-2/carecahub",
            ownerId: seedIds.student1,
            projectId: seedIds.project1,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(groups)
        .values({
          id: seedIds.group2,
          friendlyId: "Grupo 2",
          leaderId: seedIds.student2,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: groups.id,
          set: {
            friendlyId: "Grupo 2",
            leaderId: seedIds.student2,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .update(users)
        .set({ groupId: seedIds.group2, updatedAt: new Date() })
        .where(eq(users.id, seedIds.student2));

      await tx
        .insert(projects)
        .values({
          id: seedIds.project2,
          groupId: seedIds.group2,
          projectName: "ImobiUAI",
          description: "Projeto para gestão imóveis de uma imobiliária.",
          technologies: [
            "typescript",
            "nestjs",
            "react",
            "tailwindcss",
            "vite",
          ],
          usesOtherTechnology: false,
          dependencyManager: "pnpm",
          versionControl: "git",
          repositoryType: "multirepo",
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projects.id,
          set: {
            groupId: seedIds.group1,
            projectName: "ImobiUAI",
            description: "Projeto para gestão imóveis de uma imobiliária.",
            technologies: [
              "typescript",
              "nestjs",
              "react",
              "tailwindcss",
              "vite",
            ],
            usesOtherTechnology: false,
            otherTechnology: null,
            dependencyManager: "pnpm",
            otherDependencyManager: null,
            versionControl: "git",
            otherVersionControl: null,
            repositoryType: "multirepo",
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(repositories)
        .values({
          id: seedIds.repository2,
          url: "https://github.com/Felipe-SSS/FAS_MultiLClassificationXRegression",
          ownerId: seedIds.student2,
          projectId: seedIds.project2,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repositories.id,
          set: {
            url: "https://github.com/Felipe-SSS/FAS_MultiLClassificationXRegression",
            ownerId: seedIds.student2,
            projectId: seedIds.project2,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(repositories)
        .values({
          id: seedIds.repository3,
          url: "https://github.com/Felipe-SSS/spookstream",
          ownerId: seedIds.student2,
          projectId: seedIds.project2,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repositories.id,
          set: {
            url: "https://github.com/Felipe-SSS/spookstream",
            ownerId: seedIds.student2,
            projectId: seedIds.project2,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .insert(groups)
        .values({
          id: seedIds.group3,
          friendlyId: "Grupo 3",
          leaderId: seedIds.student3,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: groups.id,
          set: {
            friendlyId: "Grupo 3",
            leaderId: seedIds.student3,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

      await tx
        .update(users)
        .set({ groupId: seedIds.group3, updatedAt: new Date() })
        .where(eq(users.id, seedIds.student3));
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

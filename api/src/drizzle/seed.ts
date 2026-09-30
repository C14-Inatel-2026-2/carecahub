import 'dotenv/config'
import { groups, projects, repositories, users } from '@db'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { z } from 'zod'
import { hashPassword } from '@/utils/password'

const seedEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SEED_ADMIN_PASSWORD: z.string().min(1, 'SEED_ADMIN_PASSWORD is required'),
  SEED_USER_PASSWORD: z.string().min(1, 'SEED_USER_PASSWORD is required'),
})

export function getSeedConfig(environment: Record<string, string | undefined>) {
  const parsed = seedEnvSchema.parse(environment)
  return {
    databaseUrl: parsed.DATABASE_URL,
    adminPassword: parsed.SEED_ADMIN_PASSWORD,
    userPassword: parsed.SEED_USER_PASSWORD,
  }
}

const seedIds = {
  admin: '00000000-0000-4000-8000-000000000001',
  student: '00000000-0000-4000-8000-000000000002',
  project: '00000000-0000-4000-8000-000000000003',
  repository: '00000000-0000-4000-8000-000000000004',
  group: '00000000-0000-4000-8000-000000000005',
} as const

export async function seed(environment: Record<string, string | undefined> = process.env) {
  const config = getSeedConfig(environment)
  const [adminPassword, userPassword] = await Promise.all([
    hashPassword(config.adminPassword),
    hashPassword(config.userPassword),
  ])
  const pool = new Pool({ connectionString: config.databaseUrl })
  const db = drizzle({ client: pool })

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: seedIds.admin,
          name: 'CarecaHub Admin',
          registration: 1000001,
          githubName: 'carecahub-admin',
          classroom: null,
          email: 'admin@carecahub.local',
          password: adminPassword,
          role: 'admin',
          status: 'active',
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: 'CarecaHub Admin',
            registration: 1000001,
            githubName: 'carecahub-admin',
            classroom: null,
            email: 'admin@carecahub.local',
            password: adminPassword,
            role: 'admin',
            status: 'active',
            deletedAt: null,
            updatedAt: new Date(),
          },
        })

      await tx
        .insert(users)
        .values({
          id: seedIds.student,
          name: 'CarecaHub Student',
          registration: 1000002,
          githubName: 'octocat',
          classroom: 'A1',
          email: 'student@carecahub.local',
          password: userPassword,
          role: 'student',
          status: 'active',
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: 'CarecaHub Student',
            registration: 1000002,
            githubName: 'octocat',
            classroom: 'A1',
            email: 'student@carecahub.local',
            password: userPassword,
            role: 'student',
            status: 'active',
            deletedAt: null,
            updatedAt: new Date(),
          },
        })

      await tx
        .insert(groups)
        .values({
          id: seedIds.group,
          friendlyId: 'Grupo Seed',
          leaderId: seedIds.student,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: groups.id,
          set: {
            friendlyId: 'Grupo Seed',
            leaderId: seedIds.student,
            deletedAt: null,
            updatedAt: new Date(),
          },
        })

      await tx
        .update(users)
        .set({ groupId: seedIds.group, updatedAt: new Date() })
        .where(eq(users.id, seedIds.student))

      await tx
        .insert(projects)
        .values({
          id: seedIds.project,
          groupId: seedIds.group,
          projectName: 'CarecaHub Seed Project',
          description: 'Projeto inicial para desenvolvimento local.',
          technologies: ['typescript', 'nestjs', 'react'],
          usesOtherTechnology: false,
          dependencyManager: 'pnpm',
          versionControl: 'git',
          repositoryType: 'monorepo',
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projects.id,
          set: {
            projectName: 'CarecaHub Seed Project',
            groupId: seedIds.group,
            description: 'Projeto inicial para desenvolvimento local.',
            technologies: ['typescript', 'nestjs', 'react'],
            usesOtherTechnology: false,
            otherTechnology: null,
            dependencyManager: 'pnpm',
            otherDependencyManager: null,
            versionControl: 'git',
            otherVersionControl: null,
            repositoryType: 'monorepo',
            deletedAt: null,
            updatedAt: new Date(),
          },
        })

      await tx
        .insert(repositories)
        .values({
          id: seedIds.repository,
          url: 'https://github.com/octocat/Hello-World',
          ownerId: seedIds.student,
          projectId: seedIds.project,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repositories.id,
          set: {
            url: 'https://github.com/octocat/Hello-World',
            ownerId: seedIds.student,
            projectId: seedIds.project,
            deletedAt: null,
            updatedAt: new Date(),
          },
        })
    })

    return seedIds
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  seed()
    .then((ids) => {
      console.log('Database seed completed.', ids)
    })
    .catch((error) => {
      console.error('Database seed failed:', error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}

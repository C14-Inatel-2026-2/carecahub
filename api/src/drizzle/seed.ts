import 'dotenv/config'
import { projects, repositories, users } from '@db'
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
        .insert(projects)
        .values({
          id: seedIds.project,
          projectName: 'CarecaHub Seed Project',
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: projects.id,
          set: {
            projectName: 'CarecaHub Seed Project',
            deletedAt: null,
            updatedAt: new Date(),
          },
        })

      await tx
        .insert(repositories)
        .values({
          id: seedIds.repository,
          url: 'https://github.com/octocat/Hello-World',
          repositoryType: 'multirepo',
          ownerId: seedIds.student,
          projectId: seedIds.project,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: repositories.id,
          set: {
            url: 'https://github.com/octocat/Hello-World',
            repositoryType: 'multirepo',
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

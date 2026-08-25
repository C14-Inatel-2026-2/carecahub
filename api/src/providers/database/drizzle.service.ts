import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Logger as DrizzleLogger } from 'drizzle-orm/logger'
import { Pool } from 'pg'
import { schema } from '../../../drizzle'

class NestDrizzleLogger implements DrizzleLogger {
  constructor(private readonly logger: Logger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug(`${query} -- params: ${JSON.stringify(params)}`)
  }
}

export type DrizzleDatabase = NodePgDatabase<typeof schema>
export type DrizzleTransactionClient = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0]

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  readonly db: DrizzleDatabase
  readonly schema = schema

  private readonly logger = new Logger(DrizzleService.name)
  private readonly pool: Pool

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not defined')
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    this.db = drizzle({
      client: this.pool,
      schema,
      logger: new NestDrizzleLogger(this.logger),
    })
  }

  get users() {
    const table = this.schema.users
    const db = this.db

    return {
      table,
      columns: {
        id: table.id,
        name: table.name,
        email: table.email,
        password: table.password,
        role: table.role,
        status: table.status,
        two_factor: table.two_factor,
        created_at: table.created_at,
        updated_at: table.updated_at,
        deleted_at: table.deleted_at,
      },
      publicColumns: {
        id: table.id,
        name: table.name,
        email: table.email,
        role: table.role,
        status: table.status,
        two_factor: table.two_factor,
        created_at: table.created_at,
        updated_at: table.updated_at,
        deleted_at: table.deleted_at,
      },
      authColumns: {
        id: table.id,
        name: table.name,
        email: table.email,
        password: table.password,
        role: table.role,
        status: table.status,
        two_factor: table.two_factor,
        created_at: table.created_at,
        updated_at: table.updated_at,
        deleted_at: table.deleted_at,
      },
      passwordColumns: {
        id: table.id,
        password: table.password,
      },
      select(selection) {
        return db.select(selection).from(table)
      },
      insert(values) {
        return db.insert(table).values(values)
      },
      update() {
        return db.update(table)
      },
    }
  }

  get posts() {
    const table = this.schema.posts
    const db = this.db

    return {
      table,
      columns: {
        id: table.id,
        title: table.title,
        content: table.content,
        user_id: table.user_id,
        created_at: table.created_at,
        updated_at: table.updated_at,
        deleted_at: table.deleted_at,
      },
      select(selection) {
        return db.select(selection).from(table)
      },
      insert(values) {
        return db.insert(table).values(values)
      },
      update() {
        return db.update(table)
      },
    }
  }

  get bucketFiles() {
    const table = this.schema.bucketFiles
    const db = this.db

    return {
      table,
      columns: {
        id: table.id,
        key: table.key,
        filename: table.filename,
        size: table.size,
        url: table.url,
        is_public: table.is_public,
        created_at: table.created_at,
        updated_at: table.updated_at,
        deleted_at: table.deleted_at,
      },
      select(selection) {
        return db.select(selection).from(table)
      },
      insert(values) {
        return db.insert(table).values(values)
      },
      update() {
        return db.update(table)
      },
    }
  }

  get sysParams() {
    const table = this.schema.sysParams
    const db = this.db

    return {
      table,
      columns: {
        id: table.id,
        key: table.key,
        value: table.value,
        created_at: table.created_at,
        updated_at: table.updated_at,
      },
      select(selection) {
        return db.select(selection).from(table)
      },
      insert(values) {
        return db.insert(table).values(values)
      },
      update() {
        return db.update(table)
      },
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...')
    await this.pool.end()
    this.logger.log('Disconnected from database')
  }
}

import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import { Pool } from "pg";
import { schema } from "@db";

class NestDrizzleLogger implements DrizzleLogger {
  constructor(private readonly logger: Logger) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger.debug(`${query} -- params: ${JSON.stringify(params)}`);
  }
}

export type DrizzleDatabase = NodePgDatabase<typeof schema>;
export type DrizzleTransactionClient = Parameters<
  Parameters<DrizzleDatabase["transaction"]>[0]
>[0];

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  readonly db: DrizzleDatabase;
  readonly schema = schema;

  private readonly logger = new Logger(DrizzleService.name);
  private readonly pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle({
      client: this.pool,
      schema,
      logger: new NestDrizzleLogger(this.logger),
    });
  }

  async onModuleDestroy() {
    this.logger.log("Disconnecting from database...");
    await this.pool.end();
    this.logger.log("Disconnected from database");
  }
}

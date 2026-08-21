import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
}

export default defineConfig({
  out: './drizzle/migrations',
  schema: './db/src/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import schema from './src/schema.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
}

const db = drizzle(databaseUrl);

export default db;
export { db, schema };
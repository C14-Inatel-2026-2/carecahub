import { db, schema } from '../../../db/index.js';

export async function findManyUsers() {
  return db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
    })
    .from(schema.users);
}

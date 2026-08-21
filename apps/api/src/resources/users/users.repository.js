import { db, schema } from '../../../db/index.js';

export function buildUsersRepository({ db, schema }) {
  return {
    async findManyUsers() {
      return db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
        })
        .from(schema.users);
    },
  };
}

const usersRepository = buildUsersRepository({ db, schema });

export const { findManyUsers } = usersRepository;

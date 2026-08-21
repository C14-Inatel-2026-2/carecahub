import { db, schema } from '#db';
import { eq } from 'drizzle-orm';

/**
 * @typedef {import('./dtos/users.dto.js').UserResponseDto} UserResponseDto
 */

/**
 * @typedef {{ db: typeof import('#db').db, schema: typeof import('#db').schema }} UsersRepositoryDependencies
 */

/**
 * @param {UsersRepositoryDependencies} dependencies
 */
export function buildUsersRepository({ db, schema }) {
  return {
    /**
     * @returns {Promise<UserResponseDto[]>}
     */
    async listUsers() {
      return db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
        })
        .from(schema.users);
    },
    /**
     * @param {string} id
     * @returns {Promise<UserResponseDto | undefined>}
     */
    async findUserById(id) {
      const users = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          name: schema.users.name,
        })
        .from(schema.users)
        .where(eq(schema.users.id, id));

      return users[0];
    }
  }
}

const usersRepository = buildUsersRepository({ db, schema });

export const { listUsers, findUserById } = usersRepository;

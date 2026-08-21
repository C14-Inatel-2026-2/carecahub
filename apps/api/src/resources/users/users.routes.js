import { getUsersResponseSchema, userResponseSchema } from './dtos/users.dto.js';
import { getUsers, getUserById } from './users.service.js';

/**
 * @param {import('fastify').FastifyInstance} app
 */
export default async function usersRoutes(app) {
  app.get(
    '/',
    {
      schema: {
        response: {
          200: getUsersResponseSchema,
        },
      },
    },
    /**
     * @returns {Promise<import('./dtos/users.dto.js').UserResponseDto[]>}
     */
    async function () {
      return getUsers();
    }
  );

  app.get(
    '/:id',
    {
      schema: {
        response: {
          200: userResponseSchema,
        },
      },
    },
    /**
     * @param {import('fastify').FastifyRequest<{ Params: { id: string } }>} req
     * @returns {Promise<import('./dtos/users.dto.js').UserResponseDto | undefined>}
     */
    async function (req) {
      return getUserById(req.params.id);
    }
  );
}

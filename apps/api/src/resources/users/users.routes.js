import { getUsersResponseSchema } from './dtos/users.dto.js';
import { getUsers } from './users.service.js';

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
    async function () {
      return getUsers();
    }
  );
}

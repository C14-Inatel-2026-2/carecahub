import Fastify from 'fastify';
import usersRoutes from './resources/users/users.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async function () {
    return { status: 'ok' };
  });

  app.register(usersRoutes, {
    prefix: '/users',
  });

  return app;
}

import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get('/health', async function () {
    return { status: 'ok' };
  });

  return app;
}

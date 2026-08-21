import { buildApp } from './app.js';

const app = buildApp();

try {
  await app.listen({ port: 3000 });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
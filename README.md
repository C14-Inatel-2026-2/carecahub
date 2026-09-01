# CarecaHub

## Run locally

```bash
docker compose -f api/compose.yaml up -d

cp api/.env.example api/.env
cp web/.env.example web/.env

cd api
pnpm install
pnpm db:g
pnpm db:m
pnpm db:seed
pnpm dev
```

In another terminal:

```bash
cd web
pnpm install
pnpm dev
```

API: `http://localhost:3030`
Web: `http://localhost:5173`

## New feature checklist

1. Add or update the model in `api/drizzle`.
2. Create and apply a Drizzle migration.
3. Add the Nest resource: module, controller, service, interface, and DTOs.
4. Register the resource module in `api/src/app.module.ts`.
5. Add frontend Zod schemas, inferred request and response types in `web/src/types/<domain>.ts`.
6. Add the endpoint and response type to `web/src/api/use-list.tsx` when it is a list.
7. Add mutation endpoints to `web/src/api/writer.types.ts`.
8. Add feature pages and dialogs under `web/src/modules/<domain>/`.
9. Add the route and, when needed, the sidebar entry in the web app.

---

Keep it simple. By Gabriel Silva

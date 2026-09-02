# Scoder Template

Updated at 14 August 2026

## ⚡ Quick Start

**Prerequisites:** Docker, Node.js, pnpm

```bash
# 1. Start services (PostgreSQL + Redis)
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Generate Drizzle migration files
pnpm db:g

# 4. Run database migrations
pnpm db:m

# 5. Start development server
pnpm dev
```

**Available at:**

- API: http://localhost:3030
- Documentation: http://localhost:3030/docs
- Database: localhost:5432
- Cache: localhost:6379

### 🔧 Useful Commands

```bash
# Database
pnpm db:g              # Generate Drizzle migration files
pnpm db:m              # Run migrations
pnpm db:migrate        # Run production migrations
pnpm db:deploy         # Alias for migrations

# Development
pnpm dev               # Start with hot reload
pnpm start:debug      # Start with debugger
pnpm build             # Build for production
pnpm start:prod        # Start production build

# Docker
docker build --platform linux/amd64 -t xxxxxxxxxx.dkr.ecr.us-east-1.amazonaws.com/my-api:latest .
aws ecr get-login-password --region us-east-1 --profile xxxxx | docker login --username AWS --password-stdin xxxxxxxxxx.dkr.ecr.us-east-1.amazonaws.com
docker push xxxxxxxxxx.dkr.ecr.us-east-1.amazonaws.com/my-api:latest
```

## Resource structure

Every resource must contain a module, controller, interface, service and DTOs. Keep controllers thin, put business rules in services, and use the shared `QueryDto` for lists and `ServiceOutput<T>` for service results. DTOs must map the current Drizzle-backed schema and must never expose sensitive fields such as passwords. DTOs may extend `BaseDto`; services should return static toDto most of the time, with `ServiceOutput<T>` enforcing the TypeScript contract.

Register each resource module in `src/app.module.ts`. Use `@User()` in controllers
for authenticated ownership and enforce owner-or-admin access in the service.
List only non-deleted rows, map database records through a response DTO, and soft
delete by setting `deletedAt`.

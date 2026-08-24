# Project conventions

Every resource must include a module, controller, interface, service and DTOs.

- Keep controllers thin and place business rules in services.
- Use `QueryDto` for list endpoints.
- Use `ServiceOutput<T>` for service return values.
- Keep DTOs aligned with the current Prisma schema and never expose sensitive fields such as passwords.
- DTOs may extend `BaseDto`. Services return static toDto most of the time; `ServiceOutput<T>` enforces the TypeScript contract.
- Register resource modules in `AppModule`. Use `@User()` for ownership and keep
  authorization checks in the service when access depends on the record owner.
- List records with `deleted_at: null`, map Prisma models through a response DTO,
  and soft delete by setting `deleted_at`.

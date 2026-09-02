# CarecaHub

This is a deliberately simple repository with independent `api`, `web`, and `docs`
folders. It is not a Turborepo or a workspace monorepo.

- KISS / YAGNI: do not introduce abstractions, factories, base classes, or preparatory code for non-existent requirements.
- Prefer a direct, readable implementation over frameworks, generic repositories,
  event buses, queues, speculative caching, or extra layers.
- Do not create mocks of api for frontend.
- Configuration comes from environment variables. Never commit credentials or log
  passwords, cookies, connection strings, AWS credentials, or authorization headers.
- Keep tests focused on observable behaviour and authorization boundaries.
- Keep the web UI quick and restrained: standard shadcn/Tailwind primitives, no
  decorative animation or a design system beyond the product's needs.

## Patterns

- API resources live in `api/src/resources/<resource>/` and include a module,
  controller, service, interface, and DTOs. Register each module in `AppModule`.
- API list endpoints use `QueryDto`; services return `ServiceOutput<T>` and soft
  delete records with `deletedAt`.
- Frontend validation schemas and form requests live in `web/src/types/<domain>.ts` and use `z.infer<typeof schema>`.
- Frontend mutations use `writer("METHOD /path", options)` and handle its
  `{ ok, data | error }` result. Reads use the SWR fetcher/hooks.
- Feature pages and dialogs live in `web/src/modules/<domain>/`; use
  `list-page.tsx`, `details-page.tsx`, and `dialogs/` as needed. Shared UI stays
  in `web/src/components`.
- A navigable frontend resource needs a route, module page, SWR data hook,
  sidebar item when applicable, types, and any schema used by its forms.

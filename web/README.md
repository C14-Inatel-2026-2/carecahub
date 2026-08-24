# React + TypeScript + Vite + shadcn/ui

This is a template for a new Vite project with React, TypeScript, and shadcn/ui.

## Application patterns

- Put Zod form schemas and infer request types in `src/types` with `z.infer<typeof schema>`.
- Use React Hook Form with `zodResolver` and shadcn `Field`/`FieldError` controls.
- Read data with the SWR fetcher/hooks and write with `writer("METHOD /path", ...)`.
  Writer calls return `{ ok, data | error }`; handle that result instead of using
  exceptions for expected API failures.
- Organize feature UI by domain in `src/modules/<domain>/`. Keep list and detail
  pages at the module root and feature dialogs in `src/modules/<domain>/dialogs/`.
  Shared UI primitives remain in `src/components`.
- A navigable resource has a module page, route, SWR hook, sidebar entry when
  needed, and domain types.

## Feature modules

```text
src/modules/
  auth/
    login-page.tsx
    dialogs/
      change-password-dialog.tsx
  posts/
    list-page.tsx
    details-page.tsx
    dialogs/
      create-post-dialog.tsx
      edit-post-dialog.tsx
      post-form-dialog.tsx
  users/
    list-page.tsx
    dialogs/
      create-user-dialog.tsx
      edit-user-dialog.tsx
      delete-user-dialog.tsx
      user-form-dialog.tsx
```

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

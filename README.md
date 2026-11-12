# Evoq Launcher

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components) with React 19
- **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`)
- **shadcn/ui** (`base-nova` style, Base UI primitives, lucide icons): add components with `npx shadcn@latest add <name>`
- **TanStack Query v5** (provider in `src/components/providers.tsx`, devtools in dev)
- **Zod v4** (schemas in `src/lib/schemas`, used on both client and API routes)

## Layout

```
src/
  app/                 routes, layout, API route handlers (app/api/*)
  components/ui/       shadcn components (generated, editable)
  components/launcher/ feature components
  components/providers.tsx  QueryClient + theme + toaster
  lib/schemas/         Zod schemas and inferred types
  lib/queries/         TanStack queryOptions (shared query keys)
  lib/data/            placeholder data
```

## Scripts

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```
# Evoq-launcher

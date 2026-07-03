# Coding Agent Guidelines

> Comprehensive guide for AI coding agents working with this Next.js codebase.

## Purpose

Use this document whenever generating or updating code in this repository. Mirror existing project conventions; do not invent new patterns without a strong reason.

---

## Technology Stack

You are an expert in:

- **TypeScript** – Strict typing, interfaces over type aliases
- **Node.js** – Server-side runtime (≥20)
- **Next.js App Router** – React Server Components, layouts, route handlers
- **React** – Functional components, hooks
- **Shadcn UI & Radix** – Accessible, composable primitives
- **Tailwind CSS** – Utility-first styling
- **oRPC** – Type-safe RPC layer
- **Better Auth** – Email + password authentication (single user, signup disabled)
- **Prisma** – Database ORM
- **React Hook Form + Zod** – Forms and validation
- **TanStack Query** – Client-side data fetching and caching

---

## Architecture Overview

### Monorepo Structure

```
/
├── apps/
│   └── web/                    # The app (protected, single-user)
│       ├── app/                 # App Router routes
│       │   ├── (unauthenticated)/  # Login, forgot-password
│       │   ├── (authenticated)/    # Protected routes, one group per module
│       │   └── api/             # API route handlers
│       └── modules/             # Feature modules
│           ├── ai/              # Agent chat, greeting, briefing UI
│           ├── auth/            # Authentication components
│           ├── calendar/        # Calendar views + Outlook ICS integration
│           ├── career/          # Roles, skills, reflections, AI insights
│           ├── goals/           # Goals, milestones, check-ins
│           ├── journal/         # Journal entries + AI summary
│           ├── notes/           # Notes with reminders + pins
│           ├── tasks/           # Task list
│           ├── wishlist/        # Wishlist
│           ├── settings/        # User & account settings
│           ├── admin/           # Admin panel
│           ├── onboarding/      # First-login onboarding
│           ├── shared/          # Cross-cutting components
│           └── ...
├── packages/                    # Shared backend packages
│   ├── ai/                      # AI integrations
│   ├── api/                     # oRPC procedures and HTTP handlers
│   ├── auth/                    # Better Auth configuration
│   ├── database/                # Prisma schema and queries
│   ├── i18n/                    # Translations and locale utilities
│   ├── logs/                    # Logging configuration
│   ├── mail/                    # Email providers and templates
│   ├── notifications/           # In-app + email notifications
│   ├── storage/                 # File storage (Railway volume + S3 avatars)
│   ├── ui/                      # Shadcn UI components
│   └── utils/                   # Shared utility functions
└── tooling/                     # Build tooling and shared configs
```

### Import Conventions

Use package exports instead of deep relative imports:

```typescript
// ✅ Good
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { config } from "@config";

// ❌ Bad
import { auth } from "../../../packages/auth/auth";
```

### Path Aliases

Path aliases are configured per app. Shared package aliases apply across the monorepo:

| Alias        | Path            |
| ------------ | --------------- |
| `@repo/*`    | `packages/*`    |
| `@repo/ui/*` | `packages/ui/*` |

**apps/web** (see `apps/web/tsconfig.json` — one alias per module):

| Alias           | Path                             |
| --------------- | -------------------------------- |
| `@config`       | `apps/web/config`                |
| `@auth/*`       | `apps/web/modules/auth/*`        |
| `@settings/*`   | `apps/web/modules/settings/*`    |
| `@admin/*`      | `apps/web/modules/admin/*`       |
| `@ai/*`         | `apps/web/modules/ai/*`          |
| `@journal/*`    | `apps/web/modules/journal/*`     |
| `@calendar/*`   | `apps/web/modules/calendar/*`    |
| `@goals/*`      | `apps/web/modules/goals/*`       |
| `@tasks/*`      | `apps/web/modules/tasks/*`       |
| `@notes/*`      | `apps/web/modules/notes/*`       |
| `@career/*`     | `apps/web/modules/career/*`      |
| `@wishlist/*`   | `apps/web/modules/wishlist/*`    |
| `@onboarding/*` | `apps/web/modules/onboarding/*`  |
| `@shared/*`     | `apps/web/modules/shared/*`      |
| `@i18n/*`       | `apps/web/modules/i18n/*`        |

---

## Core Coding Principles

### TypeScript

- Write TypeScript everywhere; prefer interfaces over type aliases for object shapes
- Avoid enums; use maps/records or union literals instead
- Use functional components with TypeScript interfaces
- Export types alongside implementations when needed

```typescript
// ✅ Good
interface UserProps {
	name: string;
	email: string;
	isActive: boolean;
}

const USER_ROLES = {
	admin: "admin",
	user: "user",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ❌ Bad
type UserProps = { name: string; email: string };
enum UserRole {
	Admin,
	User,
}
```

### Functions & Components

- Export React components as named functions; avoid default exports and classes
- Prefer pure functions declared with the `function` keyword
- Use descriptive camelCase identifiers (`isLoading`, `canSubmit`, `hasError`)
- Structure files: exported component, subcomponents, helpers, static content, types

```typescript
// ✅ Good
export function UserCard({ user }: UserCardProps) {
  const isActive = user.status === "active";
  return <div>{/* ... */}</div>;
}

function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

// ❌ Bad
export default class UserCard extends Component {}
```

### Naming Conventions

| Type                | Convention            | Example                     |
| ------------------- | --------------------- | --------------------------- |
| Directories         | lowercase with dashes | `components/auth-wizard`    |
| Components          | PascalCase            | `LoginForm.tsx`             |
| Variables/Functions | camelCase             | `isLoading`, `handleSubmit` |
| Constants           | SCREAMING_SNAKE_CASE  | `MAX_RETRIES`               |
| Types/Interfaces    | PascalCase            | `UserProps`, `AuthConfig`   |

---

## React & Next.js Patterns

### Server vs Client Components

- **Default to React Server Components** – Only add `"use client"` when interactivity or browser APIs are required
- Keep client components small and focused
- Wrap client components in `Suspense` with tailored fallbacks

```typescript
// Server Component (default)
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <UserCard user={user} />;
}

// Client Component (only when needed)
"use client";

export function InteractiveCounter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Minimize Client-Side State

- Minimize `useEffect` and `useState`; favor React Server Components
- Use `nuqs` for URL search parameter state management
- Avoid client components for data fetching or state management

### Data Fetching

- Use Next.js data-fetching primitives (Route Handlers, Server Actions, `fetch` with caching tags)
- Colocate route-specific helpers under the route directory
- Share cross-route logic via `apps/web/modules`
- Honor caching and revalidation patterns already in the repo

```typescript
// Server-side data fetching in layout/page
export default async function Layout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return children;
}
```

### Error Handling

- Use `notFound()`, `redirect()`, or custom error boundaries
- Don't throw raw errors; handle them gracefully

```typescript
import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: PageProps) {
  const data = await getData(params.id);

  if (!data) {
    notFound();
  }

  if (!data.isAccessible) {
    redirect("/unauthorized");
  }

  return <Content data={data} />;
}
```

---

## API & Data Layer

### oRPC Procedures

API logic lives in `packages/api/modules`. Structure procedures with:

1. Route metadata (method, path, tags)
2. Input validation with Zod
3. Middleware (auth, locale)
4. Handler implementation

```typescript
// packages/api/modules/[feature]/procedures/[action].ts
import { publicProcedure, protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const createItem = protectedProcedure
	.route({
		method: "POST",
		path: "/items",
		tags: ["Items"],
		summary: "Create a new item",
	})
	.input(
		z.object({
			name: z.string().min(1),
			description: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Implementation
	});
```

### Procedure Types

- `publicProcedure` – No authentication required
- `protectedProcedure` – Requires authenticated session
- `adminProcedure` – Requires admin role

### Database Queries

- Use the shared client and query helpers from `@repo/database`
- Never instantiate Prisma directly in app code
- Keep queries in `packages/database/prisma/queries/`, always scoped by `userId`

```typescript
// packages/database/prisma/queries/notes.ts
export async function getNoteForUser(id: string, userId: string) {
	return await db.note.findFirst({
		where: { id, userId },
	});
}
```

### Client-Side Data Fetching

Use TanStack Query with oRPC utilities:

```typescript
"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";

export function ItemsList() {
	const { data, isLoading } = useQuery(orpc.items.list.queryOptions());

	const createMutation = useMutation(orpc.items.create.mutationOptions());

	// ...
}
```

### Notifications

- **Server:** Create notifications with `createNotification` from `@repo/notifications` (`userId`, `type`, optional JSON `data`, optional `link`). User preferences control whether a row is stored (in-app) and whether email is sent (`notification` mail template; `data.headline` / `data.title` / `data.message` drive copy when present).
- **Types:** New notification kinds require updating the `NotificationType` enum in the database schema and keeping `packages/notifications/src/types.ts` and `packages/notifications/src/catalog.ts` (`NOTIFICATION_GROUPS`, labels via `settings.notificationsPage` i18n) aligned.
- **API & UI:** oRPC lives in `packages/api/modules/notifications` (list, unread count, mark read, preferences, Web Push subscribe). The app consumes these via TanStack Query (`orpc.notifications.*`); the notification center UI is under `apps/web/modules/shared`.

---

## Authentication & Authorization

### Session Handling

- Use helpers from `@repo/auth` for session handling
- Server-side: `getSession()` from `@auth/lib/server`
- Client-side: `useSession()` hook from `@auth/hooks/use-session`

```typescript
// Server Component
import { getSession } from "@auth/lib/server";

export default async function ProtectedPage() {
	const session = await getSession();
	// ...
}

// Client Component
("use client");
import { useSession } from "@auth/hooks/use-session";

export function UserInfo() {
	const { user, loaded } = useSession();
	// ...
}
```

### User Scoping

The app is single-user with no multi-tenant layer: every read and write must be
scoped by the authenticated user's id (`where: { userId }` — or `{ id, userId }`
for single rows). A row reachable across users is a bug.

### Auth Flow Consistency

When updating auth flows, ensure:

- Email templates in `packages/mail/emails` are updated
- Audit hooks remain consistent
- Locale detection works correctly

---

## UI & Styling

### Component Library

- Use Shadcn UI components from `@repo/ui/components`
- Compose with Radix primitives when customization is needed
- Import the `cn` helper for conditional class names

```typescript
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";

export function CustomButton({ variant, className }: Props) {
  return (
    <Button className={cn("custom-styles", className)} variant={variant}>
      Click me
    </Button>
  );
}
```

### Tailwind CSS

- Follow mobile-first responsive utility ordering
- Respect design tokens from `tooling/tailwind/theme.css`
- Use consistent spacing and color variables

```typescript
// Mobile-first responsive design
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  {/* Content */}
</div>
```

### Image Optimization

- Use `next/image` with explicit `width`/`height`
- Prefer WebP format when possible
- Implement lazy loading for non-critical visuals

```typescript
import Image from "next/image";

<Image
  src="/images/hero.webp"
  alt="Hero image"
  width={1200}
  height={630}
  priority={false}
  loading="lazy"
/>
```

---

## Forms & Validation

### Form Implementation

- Use `react-hook-form` for form state management
- Use `zod` for schema validation
- Reuse existing form abstractions before creating new ones

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Handle submission
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
      </form>
    </Form>
  );
}
```

### Shared Validation Schemas

- Define validation schemas in API module types for reuse
- Import schemas from `@repo/api/modules/[feature]/types`

```typescript
// packages/api/modules/contact/types.ts
import { z } from "zod";

export const contactFormSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	message: z.string().min(10),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
```

---

## Internationalization

### Translation Strings

- Source strings via i18n utilities in `packages/i18n`
- Keep translations scoped by surface: `saas`, `mail`, and `shared`
- Use `useTranslations()` hook in components

```typescript
import { useTranslations } from "next-intl";

export function WelcomeMessage() {
  const t = useTranslations();

  return (
    <h1>{t("home.welcome.title")}</h1>
  );
}
```

### Locale Handling

- Honor locale detection from `packages/i18n/config.ts`
- Use correct cookie naming conventions (`NEXT_LOCALE`)
- Load server-side message bundles through `getMessagesForLocale(locale, scope)`
- Server components: use `setRequestLocale(locale)`

```typescript
// Server Component with locale
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Content />;
}
```

---

## Configuration

### Config files

Each package and application has its own config file to keep the config scoped.

If you need to access the config from a package, you can import it directly from the packages config file.

```typescript
import { config } from "@config";
import { config as i18nConfig } from "@repo/i18n";

// Access configuration
config.appName; // Application name
i18nConfig.defaultLocale; // Default locale
```

### Environment Variables

- Server-only variables: No prefix
- Client-accessible variables: `NEXT_PUBLIC_` prefix
- Never commit secrets; use `.env.local` (start from `.env.example` in the repo root)

**Required env vars for this project:**

| Variable | Purpose | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection | See *Deployment* below for required query params |
| `BETTER_AUTH_SECRET` | Session signing | 32-byte random |
| `NEXT_PUBLIC_SAAS_URL` | Auth + redirect base | e.g. `https://tophe.app` |
| `CALENDAR_INTEGRATION_SECRET` | AES-256-GCM key for encrypted Outlook ICS URLs | 32 bytes base64. **Never rotate** — invalidates every stored integration URL |
| `STORAGE_VOLUME_PATH` | Mount path for the user's storage module (documents, scans, large files) | Railway: `/data` (or wherever the volume is mounted). Locally: `./.local-storage` |
| `WEATHER_LATITUDE`, `WEATHER_LONGITUDE` | Optional. Enable the greeting/briefing weather line via Open-Meteo. Both unset = weather omitted | `WEATHER_LOCATION_LABEL` optionally labels the place shown in the briefing masthead (e.g. `Berlin`) |

**AI provider env vars** (configure at least one provider for the AI features; the model registry in `packages/ai/index.ts` merges whatever is configured):

| Variable | Purpose | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Optional. Enables the Claude models | Without it, no Claude models are offered |
| `OPENAI_API_KEY` | Optional. Enables a hosted OpenAI-compatible provider | OpenAI by default; any compatible host via `OPENAI_BASE_URL` |
| `OPENAI_BASE_URL` | Optional. Where that provider lives | Default `https://api.openai.com/v1`; set for OpenRouter, Groq, Mistral, etc. |
| `OPENAI_MODELS` | Optional. Curated override of model auto-discovery | Same `id` / `id=Label` format as `LOCAL_AI_MODELS`; unset = discovered from `/models` (filtered to chat models on api.openai.com) |
| `LOCAL_AI_BASE_URL` | Optional. Chat endpoint of a self-hosted model server | Ollama: `http://localhost:11434/v1`; also LM Studio, llama.cpp, vLLM, or a LAN/Tailscale host |
| `LOCAL_AI_MODELS` | Optional. Curated override of model auto-discovery | Comma-separated `id` or `id=Label`. Unset = every model on the server is offered (discovered via its `/models` endpoint) |
| `LOCAL_AI_API_KEY` | Optional bearer for the local server | Most local servers don't need one |
| `AI_DEFAULT_MODEL` | Optional. Default chat model id | Falls back to the first configured model |
| `AI_TASK_MODEL` | Optional. Pins ALL background AI (greeting, briefing, summaries, insights) to one model id | Default: per-task Claude picks when Anthropic is enabled, otherwise the default model |

Generate a 32-byte base64 secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Deployment & Runtime

### Railway

- Hosted on **Railway**. The `saas` service and its Postgres database must live in the **same Railway project** to use private networking.
- Reference the DB via `${{Postgres.DATABASE_URL}}` in the saas service's variables.
- Full `DATABASE_URL` value: `${{Postgres.DATABASE_URL}}?sslmode=require&uselibpqcompat=true`.

### Prisma 7.6 + Railway SSL gotcha

Prisma 7.6 treats `sslmode=require` as `verify-full`, which fails against Railway's self-signed Postgres certs and surfaces as `P1001: Can't reach database server`. **Always append `&uselibpqcompat=true`** to restore the libpq semantics of `require` (TLS without cert verification). This applies to both private (`.railway.internal`) and public (`.proxy.rlwy.net`) URLs.

### Local development

Your laptop can't resolve `*.railway.internal`. In local `.env`, use `DATABASE_PUBLIC_URL` (from the Railway Postgres service → Variables), with the same `?sslmode=require&uselibpqcompat=true` appended.

### Storage module — Railway volume

The storage module (private documents, scans, PDFs, multi-GB files) is backed by a **Railway Volume** mounted into the `saas` service, not by an S3 bucket. Files stream through the saas process to disk on upload and back out on view/download via `app/api/storage/upload` and `app/api/storage/files/[id]/raw` route handlers.

- **Production setup:** create a Volume on the `saas` service (Railway → service → Volumes), mount it at `/data`, set `STORAGE_VOLUME_PATH=/data` on the service. Size the volume for expected storage (it's billed per GB-minute at $0.15/GB-month).
- **Backups are not automatic.** Railway does not snapshot volumes for you. For passport-grade content set up periodic backups yourself (e.g. a separate cron service that `tar`s the volume to off-platform storage).
- **Local dev:** set `STORAGE_VOLUME_PATH=./.local-storage` (gitignored). Files written here stay on your laptop; the production volume is untouched.
- **Why not S3:** Railway's bucket credentials don't include `s3:PutBucketCORS`, which makes direct browser-to-S3 uploads (the right pattern for 2 GB+ files) impractical. The volume sidesteps CORS entirely; uploads are same-origin.
- **Storage abstraction:** filesystem helpers live in `packages/storage/filesystem/index.ts` (`writeStreamToVolume`, `readVolumeFileStream`, `deleteVolumeFile`). Avatars still use the S3 provider in the same package — the two coexist.

### Database migrations

Prisma migrations run locally against the configured `DATABASE_URL`:

```bash
pnpm --filter @repo/database generate   # regenerate client + zod after schema edits
pnpm --filter @repo/database push       # apply schema to DB (dev)
pnpm --filter @repo/database migrate    # proper migration (prod path)
```

Railway's build also runs `prisma generate` automatically, but schema changes must be pushed to the DB manually.

**Agent autonomy for schema syncs:** AI agents may run `pnpm --filter @repo/database push` without asking, as long as the change is **purely additive** with respect to the user's data — i.e. it does not drop, rename, or alter columns/tables on `Note`, `JournalEntry`, `Task`, `Goal`, `GoalMilestone`, `GoalCheckIn`, `StorageFile`, or `StorageFolder`, and does not change the on-disk semantics of any existing column on those models. Adding new tables, new optional columns, or new indexes is fine. Anything that could lose existing rows or values requires explicit confirmation first.

**Important:** This repo has no `prisma/migrations/` history — every schema change so far has been applied via `db push`. Running `prisma migrate dev` against `DATABASE_PUBLIC_URL` will detect the drift and prompt to **reset the entire public schema** (i.e. wipe live data). Do not run `migrate dev` here unless the schema has been baselined first (a deliberate, separate task that must be discussed with the user). `db push` is the correct tool until then.

### Cron jobs

Three scheduled endpoints. All require the `CRON_SECRET` env var set on the saas service and expect `Authorization: Bearer $CRON_SECRET`.

| Path | Cadence | Purpose |
| --- | --- | --- |
| `POST /api/cron/daily-reminder` | `0 * * * *` (hourly) | Idempotent journal nudges. Fires in each user's local timezone at or after 20:00 if they haven't journaled that day. |
| `POST /api/cron/calendar-reminders` | `*/5 * * * *` (every 5 min) | Scans manual calendar events with `reminderMinutes` set and creates `CALENDAR_EVENT_REMINDER` notifications. Idempotent per `(eventId, occurrenceStart)`. Outlook-synced events are skipped. |
| `POST /api/cron/briefing` | `0 * * * *` (hourly) | Builds each user's daily briefing and sends the "ready" notification at ~10:00 in their local timezone. Idempotent per local day via the `DailyBriefing` cache; outside the 10:00–12:00 local window it's a no-op, and later runs in the window don't re-notify. |

Both routes are hard-capped: the calendar reminder path bails after 100 new notifications in a single run to defend against runaway.

**Railway cron setup** — one short-lived service per cron (the saas service can't be used directly because Railway's cron restarts the whole service, and saas is a long-running web server).

For each cron:

1. **+ New → Empty Service**, name it whatever (e.g. `calendar-reminder-cron`, `daily-reminder-cron`).
2. **Settings → Source → Connect Image**: `alpine:latest`.
3. **Settings → Deploy → Cron Schedule**: `*/5 * * * *` (calendar) or `0 * * * *` (daily).
4. **Settings → Deploy → Custom Start Command**:
   ```
   sh -c 'apk add --no-cache curl && curl -f -X POST -H "Authorization: Bearer $CRON_SECRET" "$SAAS_URL/api/cron/calendar-reminders"'
   ```
   (swap the path for `/api/cron/daily-reminder` or `/api/cron/briefing` on the other services.)
5. **Variables** tab:
   - `CRON_SECRET = ${{App.CRON_SECRET}}` (reference the saas service, here named `App`)
   - `SAAS_URL = https://tophe.app` (or whatever the App's public URL is)

**Why alpine + `sh -c`, not `curlimages/curl:latest`**: that image has `curl` as its Docker ENTRYPOINT, so Railway's start command becomes arguments to curl — `curl curl -f …` tries to fetch a URL called `curl` and fails with `(3) URL rejected: Bad hostname`. Variables also don't expand because there's no shell. `alpine` has no entrypoint, so `sh -c` runs cleanly and expands env vars. Installing curl via `apk` costs ~2s per run; negligible.

**Railway cron caveats** (per their docs):
- Minimum frequency: every 5 minutes.
- Schedules are UTC.
- If a previous run is still "Active" when the next is due, Railway skips it — the cron endpoints' 15-minute lookback window recovers any skipped runs on the next one.
- The service **must exit** after the command; a long-running process blocks all future runs.

**Verifying a setup works**: run the curl manually from your machine. A `401 unauthorized` response means the route is live (just missing the bearer token) — that's proof of success. Then wait for a scheduled run and check the cron service's deployment logs for a `200` response (~80 bytes body).

---

## Tooling & Quality

### Package Manager

- Use **pnpm** for package management
- Run workspace-wide commands via **Turbo**

```bash
pnpm dev      # Start development server
pnpm build    # Build all packages
pnpm lint     # Run linting
pnpm format   # Format code
```

### Code Quality

- Linting and formatting use **Oxlint** and **Oxfmt**
- Lint all files before committing and fix all errors and warnings
- Format all files before committing
- Target Node.js ≥ 20 with ESM-compatible imports

### Pre-push type check (important)

Railway's production build runs `next build` which does full TypeScript checking; type errors **fail the deploy**. Always run a type check before pushing:

```bash
pnpm --filter web type-check
```

If the change touched multiple packages (schema + API + app is common), run the same command scoped to each touched package. Don't assume "small change" is safe — Prisma type flow through the monorepo is subtle.

### Testing

- E2E tests use **Playwright** in `apps/web/tests`
- Run tests with `pnpm test` from the app directory or workspace root

### Adding Dependencies

- Add dependencies at the correct workspace package
- Prefer the workspace `catalog:` versions in `pnpm-workspace.yaml` when the dependency is already managed there
- Wire up exports through the relevant `index.ts`
- Use the latest stable versions

---

## Performance Optimization

### Core Web Vitals

Optimize for LCP, CLS, and FID:

- Minimize `"use client"` directives
- Use dynamic imports for non-critical components
- Implement proper image optimization
- Avoid layout shifts with proper sizing

```typescript
import dynamic from "next/dynamic";

// Lazy load non-critical components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Client Component Guidelines

Limit `"use client"` to:

- Components requiring browser APIs
- Interactive elements (forms, modals)
- Small, focused client boundaries

Avoid `"use client"` for:

- Data fetching
- Complex state management
- Layout components

---

## Documentation & Change Management

### Documentation Updates

- Update `agents.md` when architectural conventions, app boundaries, aliases, or shared workflows change
- Keep README files current with setup instructions

---

## Best Practices Summary

### When Adding Features

1. Inspect neighboring files for patterns before writing new code
2. Prefer incremental, well-scoped changes over sweeping rewrites
3. Ensure new features have corresponding server and client stories (UI, API, data layer, emails if needed)
4. Test the feature locally before considering it complete

### Code Review Checklist

- [ ] TypeScript types are accurate and complete
- [ ] No `any` types without justification
- [ ] Server Components used where possible
- [ ] Forms use react-hook-form + zod
- [ ] API procedures follow existing patterns
- [ ] Translations added for user-facing strings
- [ ] Mobile-first responsive design
- [ ] Accessibility considered (Radix primitives)
- [ ] No console.log statements in production code
- [ ] Oxlint linting passes

### When in Doubt

- Inspect neighboring files for patterns before writing new code
- Ask for clarification on product requirements rather than guessing
- Prefer incremental, well-scoped changes over sweeping rewrites

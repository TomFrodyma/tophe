# Security

## Reporting a vulnerability

Please report vulnerabilities privately via GitHub's **Security → Report a
vulnerability** (private vulnerability reporting) on this repository. Don't
open a public issue for security problems.

This is a personal project with a single maintainer — you'll get a response,
but there's no SLA. Only the latest `main` is supported.

## Security model, in short

Tophe is a **single-user, self-hosted** app: signup is disabled, accounts are
created from the CLI, and every data query is scoped to the authenticated
user. There is no multi-tenant surface by design.

Things worth knowing if you're auditing:

- The only unauthenticated routes are `/api/health`, `/api/auth/**`, and the
  cron endpoints (`/api/cron/*`, which require a `CRON_SECRET` bearer token).
- AI prompts treat all stored content and feed data as untrusted: user data
  and news candidates go into the user turn, never the system prompt, and
  model output is schema-validated before persisting.
- Server-side fetches of user-supplied URLs (calendar ICS, article images)
  are scheme-checked and guarded against internal addresses.
- Provider keys and secrets are read server-side only; nothing sensitive
  ships in the client bundle.

The recommended deployment keeps AI fully local (a self-hosted model server),
so personal data never leaves your network.

# Hosted deployment

Resolution Engine has two provider modes. Local development remains zero-configuration; hosted mode keeps the same APIs and domain contracts while moving persistence to Supabase.

```text
Vercel Next.js server APIs
  ├─ Supabase PostgREST repository (server-only)
  └─ Supabase private Storage bucket (server-generated signed URLs)
```

## 1. Create Supabase resources

Create a Supabase project, then run [`supabase/migrations/001_resolution_engine.sql`](../supabase/migrations/001_resolution_engine.sql) in the SQL Editor (or apply it with the Supabase CLI). The migration creates the eight case-domain tables, foreign keys, indexes, RLS, and a **private** `resolution-evidence` bucket.

The browser must not receive a service-role key. This public prototype has no sign-in flow; all Supabase access happens through the existing Next.js server routes.

## 2. Configure Vercel

Set these server-side variables in the Vercel project:

```text
PERSISTENCE_PROVIDER=supabase
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=resolution-evidence
AI_MODE=mock
```

`AI_MODE=mock` keeps the reliable sample case independent of provider availability. To enable optional multimodal extraction, additionally configure the documented `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_MODE=openai` values. Never use `NEXT_PUBLIC_` for server keys.

## 3. Deploy and verify

Deploy the GitHub repository to Vercel. Confirm `GET /api/health` reports `status: "ok"`, `repository: "supabase"`, and `storage: "supabase"`; it deliberately reveals no credentials. In a private browser window, run **Try a sample case**, approve the recommendation, prepare the package, mark it ready, refresh, and confirm the case remains available.

For a synthetic upload, verify upload → metadata → processing → reload. Private evidence is read only by the server adapter; UI-facing URLs are short-lived signed URLs.

## Local mode

Keep the default values from `.env.example`:

```text
PERSISTENCE_PROVIDER=local
STORAGE_PROVIDER=local
AI_MODE=mock
```

This uses ignored `data/local/` JSON/files and is suitable for development and tests, not serverless deployment.

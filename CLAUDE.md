# DORA Metrics Dashboard — Claude Guidelines

## Project Structure

This is a **monorepo** with two independent packages:

```
dora/
├── backend/      # Hono HTTP server — GitHub API proxy
│   ├── index.js  # Entry point (Node.js + @hono/node-server)
│   └── package.json
└── frontend/     # React + TypeScript SPA — data visualisation
    ├── src/
    │   └── App.tsx
    └── package.json
```

Run each part independently:
- **Backend**: `cd backend && pnpm start` → listens on port `4000`
- **Frontend**: `cd frontend && pnpm start` → listens on port `3000`

---

## Backend — Hono

The backend is a **Hono** server running on Node.js via `@hono/node-server`.
It acts as a proxy for the GitHub API to avoid exposing the token to the browser.

### Route conventions

Always use Hono's typed route helpers. Never use Express-style patterns.

```ts
// ✅ Correct — Hono typed context
app.post('/api/github/releases', async (c: Context) => {
  const { repo, owner } = await c.req.json<{ repo: string; owner: string }>();
  return c.json(data);
});

// ❌ Wrong — Express style
app.post('/api/github/releases', (req, res) => { ... });
```

### Request body typing

Always type `c.req.json<T>()` with an explicit interface — never use implicit `any`:

```ts
interface ReleasesPayload {
  repo: string;
  owner: string;
}
const { repo, owner } = await c.req.json<ReleasesPayload>();
```

### Error responses

Return structured JSON errors with appropriate HTTP status codes:

```ts
return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
```

### Environment

`GITHUB_TOKEN` is loaded via `--env-file=.env` (Node.js built-in, no dotenv package needed).
Always guard routes that depend on it:

```ts
if (!GITHUB_TOKEN) return c.json({ error: 'GITHUB_TOKEN not configured' }, 500);
```

### Existing API routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/github/releases` | Fetch all releases for a repo (paginated) |
| `POST` | `/api/github/issues/bugs` | Fetch all bug issues for a repo (paginated) |

Both expect `{ repo: string; owner: string }` in the request body.

---

## Frontend — React + TypeScript

The frontend is a **Create React App** project using **TypeScript** and **Recharts**.

### TypeScript — no `any`

`any` is **forbidden**. Always define explicit types and interfaces for:
- API response shapes
- Component props
- State values
- Data transformation intermediates

```ts
// ✅ Correct
interface Release {
  published_at: string | null;
  created_at: string;
  name: string;
}

interface WeeklyEntry {
  week: string;
  Backend: number;
  Tracker: number;
  MebBO: number;
  PreRegistration: number;
  mybiogroup: number;
}

// ❌ Wrong
const releases: any[] = [];
const weekly: Record<string, any> = {};
```

### Calling the backend

The frontend always talks to `http://localhost:4000` (BACKEND_URL).
Never call the GitHub API directly from the browser.

API calls always use `POST` with `Content-Type: application/json`.

### State management

Keep fetch logic in a single `fetchData` function.
Reuse already-fetched state for derived views (e.g., `releaseData.slice(-2)` for a 2-week chart) — do **not** add extra network calls for the same data.

### Charts

Charts use **Recharts** (`BarChart`, `ResponsiveContainer`, etc.).
Always derive chart data from existing state rather than fetching again.

---

## Conventions

- **Package manager**: pnpm
- **TypeScript**: strict mode, no `any`, no implicit returns
- **No Express**: the backend uses Hono exclusively
- **No dotenv package**: use `node --env-file=.env`
- Do not add libraries without a clear need

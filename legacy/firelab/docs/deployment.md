# Deployment

FireLab is a standard Next.js (App Router) app with a SQLite database and a local asset folder. It needs a writable filesystem — that rules out pure static hosts for the full experience.

## Option A — any Node host (recommended, full features)

Works with: Vercel (with persistent volume), Railway, Render, Fly.io, your own VPS, Docker.

```bash
bun install          # or npm install
bun run db:push      # creates/updates the SQLite database
bun run build
bun run start        # serves the production build
```

Environment:
- `DATABASE_URL` — SQLite file path (e.g. `file:./db/custom.db`). Must live on a persistent volume.
- Provider keys (optional) — set them as secrets in your host's dashboard; never in the repo.

Assets (generated images, thumbnails) are written to `db/firelab-assets/` — mount a persistent volume there too, or accept that redeployments reset the gallery.

> Static hosts (GitHub Pages / Netlify static / Cloudflare Pages static) will **not** work for the full app: the API routes (provider manager, generation, persistence) need a server. The editor, mask painting, local background keying and upscaling are client-side and would survive a static export, but generation would not — FireLab deliberately does not ship a degraded "static mode" that silently breaks its core promise.

## Option B — fully local (your machine)

```bash
bun install
bun run db:push
bun run dev        # http://localhost:3000
```

Everything stays on your machine: SQLite, asset files, provider keys (`.env.local`). This is the intended "local-first" deployment.

## Docker sketch

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run db:push
ENV NODE_ENV=production
RUN bun run build
CMD ["bun", "run", "start"]
```

Mount `/app/db` for persistence.

## CI

`.github/workflows/ci.yml` runs install → typecheck → lint → build on every push/PR. No secrets are required (the built-in engine path is exercised without keys).

## Post-deploy checklist

1. `GET /api/firelab/providers` returns the registry with `builtin` available.
2. Providers → **Test connection** for every provider you configured.
3. Run one generation end-to-end and check History (provider, duration, no errors).
4. Confirm `.env*` is gitignored and your keys never appear in logs.

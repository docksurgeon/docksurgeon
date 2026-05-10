# Architecture — DockSurgeon

## Overview

DockSurgeon runs as a single Docker container on the target server. It talks directly to the Docker Engine API via the Unix socket and reads filesystem data for disk usage. A Next.js app serves both the frontend and backend API routes.

```
User Browser
     │
     │ HTTPS (via Caddy/nginx) or HTTP :4242
     ▼
Next.js App (container :3000 → host :4242)
     │
     ├── /api/*          API routes (Node.js)
     │       │
     │       ├── dockerode ──► /var/run/docker.sock (Docker Engine API)
     │       ├── better-sqlite3 ──► /app/data/surgeon.db
     │       └── child_process (df, du) ──► host filesystem stats
     │
     └── /app/*          React pages (Next.js App Router)
```

---

## Distribution Model

```
GitHub Actions
     │
     ▼
Build Docker image
     │
     ▼
Push to GHCR (ghcr.io/org/docksurgeon:latest)
     │
     ▼
install.sh pulls image + runs container
     │
     ▼
User accesses http://server-ip:4242
```

Install script is the only required step for users. No Node.js, no npm, no configuration files on the host.

---

## Container Architecture

```
docker run -d \
  --name docksurgeon \
  --restart unless-stopped \
  -p 4242:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v docksurgeon-data:/app/data \
  ghcr.io/org/docksurgeon:latest
```

Two mounts:
1. `/var/run/docker.sock` — Docker Engine API access (read/write)
2. `docksurgeon-data` — Persistent SQLite database (auth, settings, audit log)

---

## Data Flow

### Storage Analysis

```
Request: GET /api/storage/breakdown

1. dockerode.listImages()          → image sizes, tags, IDs
2. dockerode.listContainers()      → container sizes, status, image refs
3. dockerode.listVolumes()         → volume names, drivers
4. dockerode.getInfo()             → Docker root dir, driver info
5. exec: df -h /var/lib/docker     → actual disk usage
6. exec: du -sh /var/lib/docker/*  → per-directory breakdown

Aggregate + reconcile → return structured JSON
```

### Cleanup Preview

```
Request: POST /api/cleanup/preview  { targets: [...] }

1. Resolve each target via Docker API
2. Check dependencies (image used by container? volume mounted?)
3. Calculate total size that would be freed
4. Return: { items, totalBytes, riskLevel, warnings }
   — NO deletion happens here
```

### Cleanup Execute

```
Request: POST /api/cleanup/execute  { targets: [...], confirmedAt }

1. Verify confirmedAt is recent (replay protection)
2. Re-run dependency checks (state may have changed)
3. Execute via dockerode (removeImage, removeContainer, etc.)
4. Write to audit_log table
5. Return: { deleted, freed, errors }
```

### Log Streaming

```
Request: GET /api/logs/stream?container=abc123

1. dockerode.getContainer(id).logs({ follow: true, stdout, stderr })
2. Pipe Docker log stream → Server-Sent Events
3. Browser EventSource receives real-time lines
```

---

## Database Schema

```sql
-- Users (single admin, email + password)
CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    INTEGER DEFAULT (unixepoch())
);

-- App settings (key/value store)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
  -- setup_complete, app_name, theme, etc.
);

-- Audit log (every destructive action)
CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY,
  action      TEXT NOT NULL,     -- 'remove_image', 'prune_volumes', etc.
  target_id   TEXT,              -- Docker resource ID
  target_name TEXT,              -- human-readable name
  bytes_freed INTEGER,
  success     INTEGER NOT NULL,  -- 1 = success, 0 = failed
  error       TEXT,
  created_at  INTEGER DEFAULT (unixepoch())
);
```

---

## Authentication

```
Auth.js v5 (NextAuth) — CredentialsProvider

Flow:
  POST /api/auth/signin
    → validate email + password against users table (bcrypt.compare)
    → create encrypted session cookie (iron-session via Auth.js)
    → redirect to dashboard

Middleware (middleware.ts):
  All routes except /login and /setup
    → check session cookie
    → no session → redirect /login

First-run guard:
  /setup checks settings.setup_complete = 'true'
    → if true, redirect /login
    → if false, show setup wizard
```

Session cookie: `HttpOnly`, `Secure` (in production), `SameSite=Lax`, 7-day expiry.

---

## Docker Socket Access Strategy

Direct socket mount is simple but gives full Docker API access. For MVP this is acceptable since DockSurgeon is single-user, self-hosted, and runs on your own server.

**Security properties:**
- Container has full Docker API access (equivalent to root on host)
- Mitigated by: single-user auth, localhost-only port by default, audit log

**Future (v2):** Replace with Tecnativa docker-socket-proxy — whitelist only required API endpoints.

```
# MVP
/var/run/docker.sock → DockSurgeon container (full access)

# v2
/var/run/docker.sock → docker-socket-proxy (filtered) → DockSurgeon container
```

---

## Next.js Configuration

```js
// next.config.js
module.exports = {
  output: 'standalone',   // smaller Docker image, no node_modules copy
  experimental: {
    serverActions: true
  }
}
```

`standalone` output means the Docker image only contains the built app + minimal Node.js runtime. Faster pulls, smaller attack surface.

---

## Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## API Routes Structure

```
/api
  /auth
    /[...nextauth]     Auth.js handler (signin, signout, session)
  /storage
    /breakdown         GET  Full storage breakdown
    /overlay2          GET  overlay2 directory analysis
    /system            GET  docker system df equivalent
  /cleanup
    /preview           POST Preview cleanup (no deletion)
    /execute           POST Execute cleanup (after preview)
    /history           GET  Audit log
  /images
    /                  GET  List all images with size
    /[id]              DELETE Remove specific image
  /containers
    /                  GET  List all containers
    /[id]/logs         GET  Stream logs (SSE)
    /[id]              DELETE Remove stopped container
  /volumes
    /                  GET  List volumes with size
    /[id]              DELETE Remove volume
  /system
    /health            GET  CPU, RAM, disk, uptime
    /info              GET  Docker daemon info
  /setup
    /status            GET  Is setup complete?
    /complete          POST Create first admin user
```

---

## Real-time Updates

Two mechanisms:

1. **Log streaming** — Server-Sent Events (SSE)
   - Docker log stream piped to SSE
   - Browser `EventSource` API
   - No WebSocket complexity

2. **Metrics polling** — Client-side interval
   - Dashboard polls `/api/system/health` every 5s
   - Simple, no WebSocket needed for MVP
   - Replace with SSE in v2 if needed

---

## v2 Agent Architecture (Future)

For multi-server support, each remote server runs a lightweight Go agent.

```
[Dashboard App] (central, cloud or self-hosted)
      │
      │ HTTPS + API key auth
      ▼
[DockSurgeon Agent] (Go binary, each server)
      │
      ▼
/var/run/docker.sock
```

Agent exposes a minimal HTTP API. Dashboard aggregates across all registered servers. Agent installed via same `curl | bash` pattern.

Go chosen for agent because:
- Single binary, no runtime dependencies
- Small memory footprint (~5MB)
- Easy cross-compile for different Linux architectures
- Fast startup

---

## Key Engineering Risks

| Risk | Impact | Mitigation |
|---|---|---|
| overlay2 analysis requires root | High | Document requirement, fallback to Docker API sizes |
| Docker df vs df -h mismatch confuses users | Medium | Explain discrepancy in UI with tooltip |
| Deleting volume with live data | Critical | Dependency check before every delete, confirm dialog |
| Container holding important state | High | Warn on non-empty volumes, show container status |
| Socket access = root equivalent | High | Localhost-only default, auth on all routes, audit log |
| Log stream memory leak | Medium | Limit concurrent streams, timeout idle connections |

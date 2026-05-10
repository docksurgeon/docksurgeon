# Roadmap — DockSurgeon

## Philosophy

Ship the core pain solver fast. Get real users. Expand based on feedback.

Every release should answer one clear question for the user:
- **MVP:** "Why is my disk full and how do I fix it safely?"
- **v1.0:** "Can I automate this and get alerted before it gets bad?"
- **v2.0:** "Can I manage all my servers from one place?"

---

## MVP — v0.1 (Ship First)

**Goal:** One server, visual storage breakdown, safe cleanup.

### Storage Analysis
- [x] Docker storage breakdown (images, containers, volumes, build cache)
- [x] overlay2 directory size vs Docker API size reconciliation
- [x] Treemap visualization of disk usage
- [x] Show why `docker system df` and `df -h` differ

### Cleanup
- [x] Preview before delete (show items + bytes freed + risk level)
- [x] Remove unused images (dangling + unreferenced)
- [x] Remove stopped containers
- [x] Remove unused volumes
- [x] Clear build cache
- [x] Full prune (all of the above) with preview
- [x] Dependency checks (warn if image used by stopped container)
- [x] Audit log of every action

### Logs
- [x] Real-time streaming logs per container (SSE)
- [x] Search / filter log output
- [x] Download logs as file

### Server Health
- [x] Disk usage (all mount points)
- [x] CPU and memory usage
- [x] Uptime
- [x] Docker daemon info

### Auth & Setup
- [x] First-run setup wizard (set email + password)
- [x] Email + password login (Auth.js v5)
- [x] Session-based auth on all routes
- [x] Rate limiting on login (brute force protection)

### Distribution
- [x] Single Docker container install
- [x] `curl | bash` install script
- [x] Port 4242 by default
- [x] Persistent SQLite volume
- [x] GHCR image publish via GitHub Actions
- [x] `install update` command

---

## v0.2 — Polish

**Goal:** Make it feel premium. Fix rough edges from MVP feedback.

- [ ] Dark mode refinement
- [ ] Mobile responsive layout
- [ ] Better error states (Docker not running, socket permission denied)
- [ ] Cleanup history page (past actions, bytes freed over time)
- [ ] Container status badges (running / stopped / exited / paused)
- [ ] Image tag history (which images can be safely removed)
- [ ] Volume size calculation (du-based, accurate)
- [ ] Keyboard shortcuts
- [ ] Toasts / notifications for actions

---

## v1.0 — Automation

**Goal:** Set it and forget it. Get alerted before disk is full.

### Scheduled Cleanup
- [ ] Configure cleanup schedule (cron-style)
- [ ] Auto-prune rules (e.g., "remove images older than 7 days if disk > 80%")
- [ ] Dry-run mode for scheduled jobs
- [ ] Schedule audit log

### Alerts
- [ ] Disk usage threshold alerts (e.g., alert at 80%, 90%)
- [ ] Email notifications (SMTP config)
- [ ] Discord webhook notifications
- [ ] Slack webhook notifications

### History & Reporting
- [ ] Disk usage trend chart (track usage over time)
- [ ] Cleanup history with bytes freed per session
- [ ] Most space-hungry images/containers report

### Settings
- [ ] Change email / password
- [ ] Session timeout config
- [ ] Port reconfiguration
- [ ] Timezone setting

---

## v2.0 — Multi-Server

**Goal:** One dashboard for all your servers.

### Agent
- [ ] Go-based lightweight agent (single binary)
- [ ] `curl | bash` agent install per server
- [ ] Agent exposes minimal HTTP API
- [ ] mTLS between dashboard and agents
- [ ] API key per agent

### Dashboard
- [ ] Server registry (add / remove servers)
- [ ] Aggregate storage view across all servers
- [ ] Per-server health overview
- [ ] Cross-server cleanup operations
- [ ] Server labels and groups

### Auth
- [ ] Multi-user support
- [ ] Role-based access (admin / viewer)
- [ ] Per-server access control

---

## v3.0 — Intelligence

**Goal:** Tell users what to do, not just what's happening.

### AI Diagnostics
- [ ] "Why is my disk growing so fast?" — pattern analysis
- [ ] Cleanup recommendations based on usage history
- [ ] Anomaly detection (sudden spike in image count, log size, etc.)
- [ ] Natural language cleanup instructions ("clean up everything older than 2 weeks that isn't running")

### Coolify Integration
- [ ] Detect Coolify-managed resources
- [ ] Warn before touching Coolify containers / volumes
- [ ] Show Coolify app names alongside container IDs
- [ ] Coolify-aware cleanup (skip managed resources by default)

### Advanced Analysis
- [ ] Image layer deduplication analysis (Dive-like)
- [ ] Build cache dependency graph
- [ ] Log size growth rate per container
- [ ] Container restart storm detection

---

## Not Planned (Intentional Exclusions)

These are out of scope to keep the product focused:

- Kubernetes support (different product)
- Container registry management
- Docker Compose file editor
- CI/CD pipeline management
- Full Portainer-style container management (create, exec, networks)
- Windows Docker Desktop support
- Paid cloud-hosted version (self-hosted focus)

---

## Release Criteria

### MVP is shippable when:
1. Install script works on fresh Ubuntu 22.04 in under 60 seconds
2. Storage breakdown loads in under 3 seconds
3. Cleanup preview works correctly for all resource types
4. Auth flow (setup + login) works without errors
5. No action deletes data without explicit user confirmation
6. Audit log captures every destructive action

---

## Naming Note

Current name: **DockSurgeon**

Alternatives under consideration: `Pruner`, `LayerLens`, `HarborClear`

Decision deferred until pre-launch.

# Open Issues

## 1. Email Password Lost on Fresh GHCR Pull

**Status:** ✅ **RESOLVED**

**Description:**
When pulling a fresh Docker image from GHCR, the email password stored in the database is lost. This is a data persistence issue that affects the user experience during updates.

**Root Cause:**
- The database is stored in `/app/data/surgeon.db` (SQLite)
- NOT a code bug — it's a **user usage issue**
- Database persists correctly IF the volume `docksurgeon-data` is properly mounted
- Issue occurs when users:
  - Use manual `docker run` instead of `docker compose up`
  - Delete the volume accidentally
  - Switch between different docker-compose files

**Solutions Implemented:**

**1. Docker Compose Annotations (Primary)**
- Added clear warnings in `docker-compose.yml` about volume importance
- Documented the data directory structure
- Shows which volume is critical

**2. Automatic Volume Persistence**
- Volume is already configured and persistent by default
- Using `docker compose up` preserves data automatically
- No manual configuration needed for standard updates

**3. Backup & Restore Scripts**
- `backup.sh` / `backup.ps1` — Create database backups before updates
- `restore.sh` / `restore.ps1` — Restore from backups after recovery
- Works with running or stopped containers
- Both Linux/Mac and Windows support

**4. Comprehensive Documentation**
- **[UPGRADE.md](UPGRADE.md)** (new) — Complete update and disaster recovery guide
  - Standard update procedures
  - Safe update procedures for major versions
  - Volume status checks
  - Disaster recovery steps
  - Troubleshooting guide
  - Best practices
- **[DEPLOYMENT.md](DEPLOYMENT.md)** (updated) — References backup/restore scripts
- **[docker-compose.yml](docksurgeon/docker-compose.yml)** (updated) — Inline warnings
- **[README.md](docksurgeon/README.md)** (updated) — Links to guides

**5. Quick Reference**

**Update process (data automatically preserved):**
```bash
docker pull ghcr.io/docksurgeon/docksurgeon:latest
docker compose up -d
```

**Before major updates:**
```bash
./backup.sh         # Create backup
docker compose up -d  # Update
# If something breaks:
./restore.sh surgeon_backup_*.tar.gz  # Restore from backup
```

**Files Added/Modified:**
- `backup.sh` — Bash backup script (Linux/Mac)
- `backup.ps1` — PowerShell backup script (Windows)
- `restore.sh` — Bash restore script (Linux/Mac)
- `restore.ps1` — PowerShell restore script (Windows)
- `UPGRADE.md` — Complete upgrade and disaster recovery guide (new)
- `docksurgeon/docker-compose.yml` — Added volume documentation
- `DEPLOYMENT.md` — Updated with backup/restore section
- `docksurgeon/README.md` — Updated with links to guides

**Production Impact:**
- ✅ Data automatically persists across updates
- ✅ Users can safely update without losing passwords
- ✅ Easy backup/restore if disaster occurs
- ✅ Clear documentation prevents confusion

---

## 2. GHCR Doesn't Automatically Build

**Status:** ✅ **RESOLVED**

**Description:**
GitHub Container Registry (GHCR) did not automatically build and push new images when code was pushed to the repository.

**Solution Implemented:**
- Added GitHub Actions workflow: `.github/workflows/publish.yml`
  - Triggers on `push` to `main` and on tags
  - Builds the Docker image from root using `docker/build-push-action@v5`
  - Logs in to GHCR using `secrets.GITHUB_TOKEN`
  - Tags image with commit SHA and `latest` and pushes to `ghcr.io/${{ github.repository }}`

**Files Added:**
- `.github/workflows/publish.yml` — CI workflow to build & push image

**Notes / Next Steps:**
- The workflow uses `GITHUB_TOKEN` (no extra secrets required). If you prefer a deploy key or PAT scoped to `packages:write`, replace `GITHUB_TOKEN` with that secret.
- After the first run, images will appear under your GitHub Packages / Container registry (GHCR)

**Impact:** High — automated image build/publish is now in place (production-ready)

---

## 3. Native Domain Mapping for Production ✅ RESOLVED

**Description:**
Support native domain configuration for production deployments without relying on manual reverse proxy setup.

**Solution Implemented:**
- Added Domain Configuration UI in Settings page
- Created `/api/settings/domain` endpoint for getting/setting domain
- Domain stored in database settings table with validation
- Added `getAppBaseUrl()` utility function that prioritizes:
  1. Domain from database (set via UI)
  2. `NEXTAUTH_URL` environment variable
  3. Fallback to localhost:3000

**Files Added/Modified:**
- `src/app/api/settings/domain/route.ts` — API for domain management
- `src/app/(dashboard)/settings/page.tsx` — Domain configuration UI
- `src/lib/utils.ts` — `getAppBaseUrl()` helper function
- `DEPLOYMENT.md` — Production deployment guide (new)

**Production Use:**
- Users can set domain via Settings UI in production
- Or set `NEXTAUTH_URL` environment variable
- Works seamlessly with Coolify's reverse proxy and SSL
- Domain persists across container updates

---

## 4. Port 4242 Already In Use - Better Error Handling

**Status:** ✅ **RESOLVED**

**Description:**
When port 4242 is already in use on the system, Docker Compose fails to start the container with a cryptic binding error. Users don't know how to:
- Find what's using the port
- Change to a different port
- Update NEXTAUTH_URL when port changes

**Solutions Implemented:**

**1. Auto-Start Scripts (Primary)**
- `start.sh` (Linux/Mac) — Automatically finds available port and starts containers
- `start.ps1` (Windows) — PowerShell version with auto-detection

**How it works:**
```bash
./start.sh  # Scans 4242→4500, finds first available, sets up env, starts containers
```

**2. Docker Entrypoint Enhancement**
- `docker-entrypoint.sh` (Linux/Mac)
- `docker-entrypoint.ps1` (Windows)
- Detects port availability inside container
- Logs actual port and NEXTAUTH_URL being used
- Ensures configuration consistency

**3. Helper Scripts (Fallback)**
- `check-ports.sh` — Find what's using port 4242
- `check-ports.ps1` — Windows equivalent

**4. Documentation**
- Updated [DEPLOYMENT.md](DEPLOYMENT.md) with auto-start guide
- Updated [README.md](docksurgeon/README.md) with quick-start instructions

**Files Added/Modified:**
- `start.sh` — Auto-start with port detection (Linux/Mac)
- `start.ps1` — Auto-start with port detection (Windows)
- `docker-entrypoint.sh` — Container startup handler (Linux/Mac)
- `docker-entrypoint.ps1` — Container startup handler (Windows)
- `Dockerfile` — Updated to use entrypoint script
- `DEPLOYMENT.md` — Updated with auto-start instructions
- `docksurgeon/README.md` — Updated with quick-start guide

**Production Use (Recommended):**
Use auto-start scripts which handle everything:
```bash
./start.sh    # Detects port, sets NEXTAUTH_URL, starts containers
# Output: Access at http://localhost:4243 (or next available)
```

**Impact:** ✅ RESOLVED - Zero-friction port handling for both dev and production

---

## Notes
- Issue #1 is now fully resolved with scripts and comprehensive documentation
- Issue #2 (GHCR CI/CD) must be resolved before production release
- Issue #3 is production-ready
- Issue #4 is fully automated and production-ready

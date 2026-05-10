# DockSurgeon - Upgrade Guide

## Overview

Your DockSurgeon database (with passwords, settings, and audit logs) persists automatically via Docker volumes. However, proper update procedures ensure data safety.

## ⚠️ Critical Rules

**DO:**
- ✅ Always use `docker compose up` to start/update the app
- ✅ Backup before major version updates
- ✅ Keep the `docksurgeon-data` volume intact

**DON'T:**
- ❌ Delete the volume: `docker volume rm docksurgeon-data`
- ❌ Use manual `docker run` without volume mounting
- ❌ Change the volume name in docker-compose.yml
- ❌ Store data outside of `/app/data` in the container

---

## Standard Update (Patch/Minor Versions)

For routine updates (e.g., 1.0.0 → 1.0.1), data automatically persists:

```bash
# Step 1: Pull latest image
docker pull ghcr.io/yourusername/docksurgeon:latest

# Step 2: Update running containers
docker compose up -d

# That's it! Your data is preserved automatically.
```

**What happens internally:**
- New container starts with old volume
- Database already exists with your passwords/settings
- App initializes successfully with existing data

---

## Safe Update (Major Versions)

For major updates (e.g., 1.0 → 2.0), backup first:

```bash
# Step 1: Backup current database
./backup.sh

# Step 2: Pull latest image
docker pull ghcr.io/yourusername/docksurgeon:latest

# Step 3: Update and restart
docker compose up -d

# Step 4: Verify everything works
# Access your app and confirm passwords/settings are intact
```

**If something goes wrong:**
```bash
# Restore from backup
./restore.sh surgeon_backup_YYYYMMDD_HHMMSS.tar.gz
```

---

## Checking Volume Status

### Verify volume exists:
```bash
docker volume ls | grep docksurgeon-data
# Output: local     docksurgeon-data
```

### Check volume contents:
```bash
docker run --rm -v docksurgeon-data:/data alpine ls -la /data/
# Should show: surgeon.db (the database file)
```

### Inspect volume location:
```bash
docker inspect docksurgeon-data | grep Mountpoint
# Shows where Docker stores the data on your server
```

---

## Disaster Recovery

### Lost Database? Restore from Backup

```bash
./restore.sh surgeon_backup_20260510_120000.tar.gz
```

### No Backup? Try Recovery

If you didn't backup, check if Docker has the data in its backup locations:

**Linux/Mac:**
```bash
# Find Docker's data directory
docker volume inspect docksurgeon-data

# List data files
sudo ls -la /var/lib/docker/volumes/docksurgeon-data/_data/
```

**Windows (Docker Desktop):**
```powershell
docker volume inspect docksurgeon-data
# Check VM path: \\.\pipe\... or WSL2 backend
```

---

## Troubleshooting

### "My password disappeared after update!"

**Check 1:** Verify volume still exists
```bash
docker volume ls | grep docksurgeon-data
```

If missing, you likely:
- Used `docker stop` + deleted container + used new `docker run` (wrong!)
- Ran `docker volume rm docksurgeon-data` (wrong!)
- Switched to different docker-compose file

**Solution:** Use `./restore.sh` if you have a backup, or reconfigure passwords.

### "Volume is full or corrupted"

```bash
# Stop containers
docker compose down

# Backup current state
docker run --rm -v docksurgeon-data:/data -v .:/backup alpine \
  tar czf /backup/emergency_backup.tar.gz -C /data .

# Remove and recreate volume
docker volume rm docksurgeon-data
docker volume create docksurgeon-data

# Restore from backup if needed
./restore.sh emergency_backup.tar.gz
```

### "Running with wrong volume"

Check docker-compose.yml:
```yaml
volumes:
  docksurgeon:
    - docksurgeon-data:/app/data  # ✅ Correct
    # NOT: - /tmp/data:/app/data     # ❌ Wrong (data lost on reboot)
```

---

## Best Practices

1. **Backup Schedule**
   ```bash
   # Weekly backup
   0 2 * * 0 /path/to/backup.sh /backups
   ```

2. **Version Tracking**
   ```bash
   # Keep backups organized
   ./backup.sh ./backups/
   # Creates: ./backups/surgeon_backup_20260510_120000.tar.gz
   ```

3. **Test Updates**
   ```bash
   # Before production update:
   # 1. Backup current database
   ./backup.sh
   # 2. Update in staging/test environment
   # 3. Verify functionality
   # 4. Then update production
   ```

4. **Monitor Volume Size**
   ```bash
   # Check how much space database uses
   docker exec docksurgeon du -sh /app/data
   ```

---

## Reference

**Related Documentation:**
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production setup guide
- [README.md](docksurgeon/README.md) — Quick start

**Scripts:**
- `backup.sh` / `backup.ps1` — Create database backup
- `restore.sh` / `restore.ps1` — Restore from backup
- `docker-compose.yml` — Volume configuration

---

**Questions?** Check the logs:
```bash
docker compose logs -f docksurgeon
```

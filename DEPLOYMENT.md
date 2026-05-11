# DockSurgeon - Deployment Guide

## Production Deployment with Coolify

### 1. Port Configuration

DockSurgeon runs on port **3000 internally** but is exposed via port **4242 by default**.

#### Automatic Port Detection (Recommended)

The easiest way is to use the auto-start scripts that detect conflicts and find available ports automatically:

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows PowerShell:**
```powershell
.\start.ps1
```

These scripts will:
- ✅ Detect if port 4242 is available
- ✅ Scan for next available port if not (4243, 4244, etc.)
- ✅ Automatically set `DS_PORT` and `NEXTAUTH_URL`
- ✅ Start containers and show the access URL

**Output example:**
```
🐳 Scanning for available port (starting from 4242)...
🐳 ✅ Found available port: 4243
🐳 Configuration:
  📌 Port: 4243
  🔐 NEXTAUTH_URL: http://localhost:4243
🐳 ✅ DockSurgeon is ready!
   Access at: http://localhost:4243
```

#### Manual Port Configuration

If you prefer to set the port manually:

```bash
# Option 1: Environment variable
export DS_PORT=5000
docker compose up -d

# Option 2: .env file
echo "DS_PORT=5000" >> .env
docker compose up -d
```

**CRITICAL:** When changing the port, update `NEXTAUTH_URL` to match:

```yaml
environment:
  - DS_PORT=5000
  - NEXTAUTH_URL=http://localhost:5000  # Must match the exposed port!
  - NEXTAUTH_SECRET=your-secret
```

#### Finding Available Ports

**Check if port is in use:**

```bash
# Linux/Mac
lsof -i :4242

# Windows PowerShell
netstat -ano | findstr ":4242"
```

**Find available ports (Easy way):**

Use the included helper script:

```bash
# Linux/Mac
chmod +x check-ports.sh
./check-ports.sh

# Windows PowerShell
.\check-ports.ps1
```

**Find available ports (Manual):**

```bash
# Linux/Mac
for port in {4000..4500}; do
  (echo >/dev/tcp/127.0.0.1/$port) 2>/dev/null || echo "Port $port is available"
done | head -5

# Windows
$port = 4000; while($port -lt 4300) {
  $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
  if(-not $connection.TcpTestSucceeded) { Write-Host "Port $port is available" }
  $port++
}
```

### 2. Domain Configuration

DockSurgeon now supports native domain configuration for production deployments.

#### Option A: Using the Settings UI (Recommended)

1. Deploy your app to Coolify
2. Access the web UI and go to **Settings**
3. In the **Domain Configuration** section, enter your public domain (e.g., `surgeon.example.com`)
4. Click **Save domain**
5. The domain is stored in the database and used for authentication

#### Option B: Environment Variable (Alternative)

Set the `NEXTAUTH_URL` environment variable in your docker-compose or Coolify:

```yaml
environment:
  - NEXTAUTH_URL=https://surgeon.example.com
  - NEXTAUTH_SECRET=your-secret-here
```

#### Option C: Combining Both

For maximum flexibility, the app will use this priority:
1. Domain from database settings (if set via UI)
2. `NEXTAUTH_URL` environment variable (if set)
3. Fallback to localhost:3000 (development only)

### 2. DNS Configuration

In your DNS provider (e.g., Cloudflare, Route53):

1. Create an A record pointing your domain to your server's IP:
   ```
   surgeon.example.com  A  123.45.67.89
   ```

2. Wait for DNS propagation (may take a few minutes)

### 3. Coolify Setup

1. In Coolify Dashboard, add your docksurgeon service
2. **Set the domain**: `surgeon.example.com`
3. Coolify will:
   - Auto-generate SSL certificate via Let's Encrypt
   - Set up reverse proxy to port 3000
   - Handle HTTPS redirects

### 4. Database Persistence (Critical!)

**Your email passwords and settings persist across updates ONLY if the volume is maintained.**

```yaml
volumes:
  docksurgeon-data:
    driver: local
```

⚠️ **DO NOT DELETE THIS VOLUME** - it contains your admin password and all settings.

**Proper Update Process:**

```bash
# Pull latest image
docker pull ghcr.io/docksurgeon/docksurgeon:latest

# Update containers (data automatically persists)
docker compose up -d
```

**That's it!** The `docksurgeon-data` volume automatically preserves your database across updates.

**Before Major Updates - Create Backup:**

```bash
# Linux/Mac
./backup.sh

# Windows PowerShell
.\backup.ps1
```

Output: `surgeon_backup_YYYYMMDD_HHMMSS.tar.gz`

**To Restore from Backup:**

```bash
# Linux/Mac
./restore.sh surgeon_backup_YYYYMMDD_HHMMSS.tar.gz

# Windows PowerShell
.\restore.ps1 -BackupFile "surgeon_backup_YYYYMMDD_HHMMSS.tar.gz"
```

See [UPGRADE.md](UPGRADE.md) for complete update and disaster recovery guide.

### 5. Updating the App

When you pull fresh images:

```bash
docker compose pull
docker compose up -d
```

The volume will persist automatically. Email passwords and settings remain intact.

### 6. Environment Variables

Minimum required for production:

```bash
NEXTAUTH_URL=https://surgeon.example.com
NEXTAUTH_SECRET=generate-a-random-secret-here
NODE_ENV=production
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 7. Security Checklist

- [ ] Firewall blocks direct access to port 3000 (Coolify handles routing)
- [ ] Domain uses HTTPS (Let's Encrypt via Coolify)
- [ ] Strong admin password set in Settings
- [ ] Regular backups of `/app/data/surgeon.db`
- [ ] Monitor audit logs for suspicious activity
- [ ] Keep DockSurgeon updated regularly

### 8. Troubleshooting

#### "Email password lost after update"
- Ensure the `docksurgeon-data` volume is mounted
- Check volume exists: `docker volume ls | grep surgeon`
- Verify Docker Compose volume config

#### "Domain configuration not applied"
- Set it via Settings UI OR
- Set `NEXTAUTH_URL` environment variable in docker-compose
- Restart the container: `docker compose restart`

#### "SSL certificate issues"
- Let Coolify manage certificates automatically
- Don't modify NEXTAUTH_URL after setup
- Check Coolify dashboard for certificate renewal status

---

**Questions?** Check the [README](README.md) or review the [ARCHITECTURE](ARCHITECTURE.md) documentation.

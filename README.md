# 🔪 DockSurgeon

**Visual Docker storage analysis and cleanup** — see exactly what's eating your disk and reclaim it with one click.

![DockSurgeon Logo](/public/logo/logo-with-name.png)

---

## 🚀 Quick Start

> **Requirement:** Docker with the Compose V2 plugin (`docker compose`, not `docker-compose`).  
> Install: https://docs.docker.com/compose/install/

### Option 1 — Docker Compose (recommended)

```bash
# 1. Download the compose file
curl -fsSL https://raw.githubusercontent.com/<org>/docksurgeon/main/docker-compose.yml -o docker-compose.yml

# 2. Generate a secret and start
export NEXTAUTH_SECRET=$(openssl rand -base64 48)
docker compose up -d

# Access at http://<your-server-ip>:4242
```

> Only the `docker-compose.yml` is needed — Docker pulls the image from GHCR automatically.

### Option 2 — Docker run (no compose file)

```bash
docker run -d \
  --name docksurgeon \
  --restart unless-stopped \
  --pid host \
  --privileged \
  -p 4242:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v docksurgeon-data:/app/data \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 48)" \
  -e NEXTAUTH_URL="http://$(hostname -I | awk '{print $1}'):4242" \
  -e NODE_ENV=production \
  ghcr.io/<org>/docksurgeon:latest

# Access at http://<your-server-ip>:4242
```

---

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | **required** | Random secret for session signing |
| `NEXTAUTH_URL` | `http://localhost:4242` | Public URL of the app |
| `DS_PORT` | `4242` | Host port to bind |
| `DS_DATA_DIR` | `/app/data` | Database directory inside container |

### Custom port

```bash
export DS_PORT=5000
export NEXTAUTH_URL="http://localhost:5000"
docker compose up -d
```

---

## 🔄 Updating

```bash
docker compose pull
docker compose up -d
```

Data persists automatically in the `docksurgeon-data` Docker volume.

---

## 💾 Backup & Restore

```bash
# Backup database
docker cp docksurgeon:/app/data/surgeon.db ./surgeon-backup-$(date +%Y%m%d).db

# Restore
docker stop docksurgeon
docker cp ./surgeon-backup-YYYYMMDD.db docksurgeon:/app/data/surgeon.db
docker start docksurgeon
```

---

## 🏗️ Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🐳 Docker Build

```bash
docker build -t docksurgeon .
```

The build is fully automated via GitHub Actions — every push to `main` publishes `latest` to GHCR.

---

## 🔐 Security

DockSurgeon requires privileged access and the Docker socket (equivalent to root on the host).

- Keep the port firewalled — do **not** expose port 4242 directly to the internet
- Use Caddy or nginx with SSL for external access
- All destructive actions are recorded in the built-in audit log

---

## 📄 License

MIT

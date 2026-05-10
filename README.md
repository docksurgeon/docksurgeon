<div align="center">

# 🔪 DockSurgeon

**Perform surgery on your bloated Docker storage. Reclaim your disk space with precision.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Image](https://img.shields.io/badge/Docker-ghcr.io-blue?logo=docker)](https://github.com/docksurgeon/docksurgeon/pkgs/container/docksurgeon)

<img src="public/logo/logo-with-name.png" width="450" alt="DockSurgeon Logo" />

</div>

---

### 📋 The Scenario
Your server is running out of disk space. You know Docker is the culprit, but finding exactly which **dangling image**, **unused volume**, or **abandoned container** is eating those 20GBs is a headache. 

**DockSurgeon** gives you the "surgeon's view" — a beautiful, visual dashboard to analyze your storage and perform precise cleanup operations without touching the command line.

---

### ✨ Features
- 📊 **Visual Storage Breakdown**: See exactly how much space Images, Containers, and Volumes are taking.
- 🧹 **One-Click Cleanup**: Safely purge dangling assets that are wasting space.
- 🔍 **Deep Inspection**: View detailed metadata and logs for every Docker object.
- 🛡️ **Secure by Design**: Self-hosted, private, and requires zero external cloud dependencies.
- 🚀 **Smart Port Detection**: Automatically finds available ports to avoid conflicts during setup.

---

### 🚀 Quick Start (Production)

#### 🛠️ Option 1: Docker Compose (Recommended)
This is the easiest way to keep your server clean and organized.

```bash
# 1. Download the compose file
curl -fsSL https://raw.githubusercontent.com/docksurgeon/docksurgeon/main/docker-compose.yml -o docker-compose.yml

# 2. Start the surgery
export NEXTAUTH_SECRET=$(openssl rand -base64 48)
docker compose up -d
```
🌐 Access at `http://your-server-ip:4242`

#### 🐳 Option 2: One-Line Docker Run
If you just want to run it once without a file:

```bash
docker run -d \
  --name docksurgeon \
  --restart unless-stopped \
  --pid host \
  --privileged \
  -p 4242:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v docksurgeon-data:/app/data \
  -e NEXTAUTH_URL="http://$(curl -s ifconfig.me):4242" \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NODE_ENV=production \
  ghcr.io/docksurgeon/docksurgeon:main
```

---

### 🔄 Staying Up to Date
Updating is simple. If you used the `docker run` method, we recommend creating an `update.sh` script:

```bash
# Pull the latest image and restart
docker pull ghcr.io/docksurgeon/docksurgeon:main
docker rm -f docksurgeon
# (Run your docker run command again)
```

---

### 🏗️ Development
Want to contribute? Setting up a local environment is easy:

```bash
git clone https://github.com/docksurgeon/docksurgeon.git
cd docksurgeon
npm install
npm run dev
```

---

### 🔐 Security & Privacy
- 🔌 **Local Socket**: DockSurgeon communicates directly with `/var/run/docker.sock`.
- 🛂 **Authentication**: Built-in login protection ensures only you can perform surgery.
- 🕵️ **Audit Logs**: Every action is logged for your review.

---

<div align="center">
Built with ❤️ for the Docker Community.
</div>

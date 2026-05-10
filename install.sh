#!/bin/bash
set -e

# ANSI Colors for a premium feel
GREEN='\033[0;32m'
BOLD='\033[1m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}🔪 DockSurgeon - SaaS Master Installer${NC}"
echo "------------------------------------------------"

# 1. Detect environment
PUBLIC_IP=$(curl -s --connect-timeout 2 https://checkip.amazonaws.com || curl -s --connect-timeout 2 ifconfig.me || echo "unknown")
echo -e "📡 Detected Public IP: ${GREEN}$PUBLIC_IP${NC}"

# 2. Check for port 80/443
PORT_80_FREE=true
if lsof -i:80 > /dev/null 2>&1; then
    PORT_80_FREE=false
    echo -e "⚠️  Note: Port 80 is currently occupied (Existing Proxy Detected)."
fi

# 3. Generate Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 4. Clean up old instances
echo -e "\n${BLUE}🧹 Cleaning up old instances...${NC}"
docker rm -f docksurgeon 2>/dev/null || true

# 5. Launch MVP Strategy (IP Only)
echo -e "🚀 Starting DockSurgeon MVP (IP Mode)..."
docker run -d \
  --name docksurgeon \
  --restart unless-stopped \
  --pid host \
  --privileged \
  -p 4242:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v docksurgeon-data:/app/data \
  -e AUTH_TRUST_HOST=true \
  -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  -e NODE_ENV=production \
  ghcr.io/docksurgeon/docksurgeon:main

echo -e "\n${GREEN}${BOLD}✅ INSTALLATION COMPLETE!${NC}"
echo "------------------------------------------------"
echo -e "🌐 Access your MVP dashboard at: ${BLUE}http://$PUBLIC_IP:4242${NC}"
echo -e "\n${BOLD}Check logs with:${NC} docker logs docksurgeon"

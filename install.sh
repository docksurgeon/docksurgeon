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

# 3. Prompt for domain (or skip)
echo -e "\n${BOLD}🌐 Domain Configuration${NC}"
read -p "Enter your SaaS domain (e.g. app.example.com) [Leave blank for IP access]: " DOMAIN

# 4. Generate Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 5. Clean up old instances
echo -e "\n${BLUE}🧹 Cleaning up old instances...${NC}"
docker rm -f docksurgeon docksurgeon-proxy 2>/dev/null || true

# 6. Launch Strategy
if [ -z "$DOMAIN" ]; then
    # IP-Only Mode
    echo -e "🚀 Starting in ${BOLD}Standard Mode${NC} (IP:4242)..."
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
else
    if [ "$PORT_80_FREE" = true ]; then
        # Effortless SSL Mode (Port 80/443)
        echo -e "🚀 Starting in ${BOLD}Effortless SaaS Mode${NC} (SSL on 80/443)..."
        # Download compose
        curl -fsSL https://raw.githubusercontent.com/docksurgeon/docksurgeon/main/docker-compose.yml -o docker-compose.yml
        # Start
        NEXTAUTH_URL="https://$DOMAIN" NEXTAUTH_SECRET="$NEXTAUTH_SECRET" docker compose up -d
    else
        # Proxy-Aware Mode
        echo -e "🚀 Starting in ${BOLD}Proxy-Aware Mode${NC} (Use existing proxy for SSL)..."
        docker run -d \
          --name docksurgeon \
          --restart unless-stopped \
          --pid host \
          --privileged \
          -p 4242:3000 \
          --label "coolify.managed=true" \
          --label "coolify.proxy.domain=$DOMAIN" \
          --label "coolify.proxy.port=3000" \
          -v /var/run/docker.sock:/var/run/docker.sock \
          -v docksurgeon-data:/app/data \
          -e AUTH_TRUST_HOST=true \
          -e NEXTAUTH_URL="https://$DOMAIN" \
          -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
          -e NODE_ENV=production \
          ghcr.io/docksurgeon/docksurgeon:main
    fi
fi

echo -e "\n${GREEN}${BOLD}✅ INSTALLATION COMPLETE!${NC}"
echo "------------------------------------------------"
if [ -z "$DOMAIN" ]; then
    echo -e "🌐 Access your dashboard at: ${BLUE}http://$PUBLIC_IP:4242${NC}"
else
    echo -e "🌐 Access your dashboard at: ${BLUE}https://$DOMAIN${NC}"
fi
echo -e "\n${BOLD}Check logs with:${NC} docker logs docksurgeon"

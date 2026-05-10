#!/bin/bash
set -e

# ANSI Colors for a premium feel
GREEN='\033[0;32m'
BOLD='\033[1m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

cat << "EOF"
      
    ____             _    ____                                
   |  _ \  ___   ___| | _/ ___| _   _ _ __ __ _  ___  ___  _ __ 
   | | | |/ _ \ / __| |/ \___ \| | | | '__/ _` |/ _ \/ _ \| '_ \
   | |_| | (_) | (__|   < ___) | |_| | | | (_| |  __/ (_) | | | |
   |____/ \___/ \___|_|\_\____/ \__,_|_|  \__, |\___|\___/|_| |_|
                                          |___/                   
EOF
echo -e "${CYAN}${BOLD}   DockSurgeon Installer (MVP Edition)${NC}"
echo "   --------------------------------------------------------------"
echo ""

# 1. Detect environment
echo -e "🔍 ${BOLD}Detecting Environment...${NC}"
PUBLIC_IP=$(curl -s --connect-timeout 2 https://checkip.amazonaws.com || curl -s --connect-timeout 2 ifconfig.me || echo "unknown")
echo -e "   📡 Public IP: ${GREEN}$PUBLIC_IP${NC}"

# 2. Check for port 80/443
if lsof -i:80 > /dev/null 2>&1; then
    echo -e "   ⚠️  Port 80 is occupied (Running in Standalone Port 4242 mode)"
else
    echo -e "   ✅ Port 80 is free"
fi

# 3. Generate Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 4. Clean up old instances
echo -e "\n🧹 ${BOLD}Cleaning up old instances...${NC}"
docker rm -f docksurgeon >/dev/null 2>&1 || true
echo -e "   ✅ Cleaned"

# 5. Launch MVP Strategy (IP Only)
echo -e "\n🚀 ${BOLD}Starting DockSurgeon...${NC}"
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
  ghcr.io/docksurgeon/docksurgeon:main >/dev/null

echo -e "\n${GREEN}${BOLD}   [✓] INSTALLATION COMPLETE!${NC}"
echo "   --------------------------------------------------------------"
echo -e "   🌐 Access your dashboard at: ${BLUE}${BOLD}http://$PUBLIC_IP:4242${NC}"
echo -e "   --------------------------------------------------------------\n"


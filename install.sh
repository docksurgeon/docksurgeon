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
echo -e "🔍 ${BOLD}System Check${NC}"
PUBLIC_IP=$(curl -s --connect-timeout 2 https://checkip.amazonaws.com || curl -s --connect-timeout 2 ifconfig.me || echo "unknown")
echo -e "   📡 Detected IP: ${GREEN}$PUBLIC_IP${NC}"

if lsof -i:80 > /dev/null 2>&1; then
    echo -e "   ⚠️  Port 80 busy: DockSurgeon will run on ${BOLD}Port 4242${NC} only."
else
    echo -e "   ✅ Port 80 free: Available for future routing."
fi

# 2. Generate Security Assets
echo -e "\n🛡️  ${BOLD}Generating Security Assets${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "   ✅ Cryptographic secret generated"

# 3. Clean up
echo -e "\n🧹 ${BOLD}Preparing Environment${NC}"
docker rm -f docksurgeon >/dev/null 2>&1 || true
echo -e "   ✅ Old containers cleared"

# 4. Launch
echo -e "\n🚀 ${BOLD}Deploying DockSurgeon MVP${NC}"
echo -e "   📦 Mounting: Docker Socket (/var/run/docker.sock)"
echo -e "   💾 Mounting: Persistent Data (docksurgeon-data)"
echo -e "   🔌 Binding:  Port 4242\n"

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

echo -e "   ✅ Container deployed successfully!"

echo -e "\n${GREEN}${BOLD}==============================================================${NC}"
echo -e "${GREEN}${BOLD}   🎉 INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}${BOLD}==============================================================${NC}"
echo -e "\n   ${BOLD}Next Steps:${NC}"
echo -e "   1. Open your browser to: ${BLUE}${BOLD}http://$PUBLIC_IP:4242${NC}"
echo -e "   2. Log in and start managing your containers."
echo -e "   3. ${BOLD}Security Note:${NC} Keep port 4242 firewalled if exposing to the public internet."
echo -e "\n   To view live server logs, run: ${CYAN}docker logs -f docksurgeon${NC}"
echo -e "==============================================================\n"


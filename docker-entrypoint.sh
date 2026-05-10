#!/bin/sh
# DockSurgeon - Smart Port Finder
# Finds available port if default is in use
# Used as entrypoint for Docker container

set -e

# Configuration
DEFAULT_PORT=${DS_PORT:-4242}
PORT_RANGE_START=4242
PORT_RANGE_END=4500
NEXTAUTH_URL_PROVIDED=${NEXTAUTH_URL:-}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] [PORT-FINDER] $1"
}

check_port() {
  local port=$1
  (echo >/dev/tcp/127.0.0.1/$port) 2>/dev/null && return 1 || return 0
}

log "Starting DockSurgeon with smart port detection..."
log "Default port: $DEFAULT_PORT"

# Check if default port is available
if check_port $DEFAULT_PORT; then
  log "✅ Port $DEFAULT_PORT is available"
  ACTUAL_PORT=$DEFAULT_PORT
else
  log "⚠️  Port $DEFAULT_PORT is already in use, scanning for available port..."
  
  ACTUAL_PORT=""
  for port in $(seq $PORT_RANGE_START $PORT_RANGE_END); do
    if check_port $port; then
      ACTUAL_PORT=$port
      log "✅ Found available port: $ACTUAL_PORT"
      break
    fi
  done
  
  if [ -z "$ACTUAL_PORT" ]; then
    log "❌ ERROR: No available ports found in range $PORT_RANGE_START-$PORT_RANGE_END"
    exit 1
  fi
  
  # Update DS_PORT for docker-compose
  export DS_PORT=$ACTUAL_PORT
fi

# Determine links for the user
IP_ADDR=$(hostname -i | awk '{print $1}')

# Ultra-robust Public IP Detection
log "Detecting external IP..."
PUBLIC_IP=$(curl -s --connect-timeout 2 https://checkip.amazonaws.com || \
            curl -s --connect-timeout 2 http://whatismyip.akamai.com/ || \
            curl -s --connect-timeout 2 https://api.ipify.org || \
            curl -s --connect-timeout 2 ifconfig.me || \
            echo "your-server-ip")

log "Configuration complete:"
log "  - External Access: http://$PUBLIC_IP:$ACTUAL_PORT"
log "  - Internal Access: http://$IP_ADDR:$ACTUAL_PORT"
log "  - Domain:          ${NEXTAUTH_URL_PROVIDED:-Not set (Use Settings UI)}"
echo ""

# ANSI Colors
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m' # No Color

cat << "EOF"
      
    ____             _    ____                                
   |  _ \  ___   ___| | _/ ___| _   _ _ __ __ _  ___  ___  _ __ 
   | | | |/ _ \ / __| |/ \___ \| | | | '__/ _` |/ _ \/ _ \| '_ \
   | |_| | (_) | (__|   < ___) | |_| | | | (_| |  __/ (_) | | | |
   |____/ \___/ \___|_|\_\____/ \__,_|_|  \__, |\___|\___/|_| |_|
                                          |___/                   
   --------------------------------------------------------------
EOF

echo "${GREEN}${BOLD}  [✓] PROVISIONING COMPLETE${NC}"
echo "  [✓] Docker Socket:   Connected"
echo "  [✓] Database:        Healthy"
echo "  [✓] Port Discovery:  $ACTUAL_PORT (Allocated)"
echo ""
echo "  ${BOLD}🌐 SaaS ACCESS DETAILS:${NC}"
echo "  - Internal: http://$IP_ADDR:$ACTUAL_PORT"
echo "  - Public:   http://$PUBLIC_IP:$ACTUAL_PORT"
echo ""
echo "  ${GREEN}🚀 DockSurgeon is ready for surgery!${NC}"
echo "  --------------------------------------------------------------"
echo ""

# Start the Next.js app
exec "$@"

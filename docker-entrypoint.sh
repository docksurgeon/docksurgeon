#!/bin/bash
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

# Set NEXTAUTH_URL if not explicitly provided
if [ -z "$NEXTAUTH_URL_PROVIDED" ]; then
  export NEXTAUTH_URL="http://localhost:$ACTUAL_PORT"
  log "ℹ️  NEXTAUTH_URL set to: $NEXTAUTH_URL"
else
  log "ℹ️  Using provided NEXTAUTH_URL: $NEXTAUTH_URL_PROVIDED"
fi

log "Configuration complete:"
log "  - Port: $ACTUAL_PORT"
log "  - NEXTAUTH_URL: ${NEXTAUTH_URL:-not set}"
log ""
log "Starting Next.js application..."
log "================================"

# Start the Next.js app
exec "$@"

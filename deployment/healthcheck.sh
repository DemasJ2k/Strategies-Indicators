#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# Flowrex Health Check Script
# ═══════════════════════════════════════════════════════════════
# Checks if the Flowrex server is responsive and healthy

set -e

# Configuration
HOST="${HOST:-localhost}"
PORT="${PORT:-4000}"
TIMEOUT=5

# Check if server responds to health endpoint
response=$(curl -f -s -o /dev/null -w "%{http_code}" \
  --max-time $TIMEOUT \
  "http://${HOST}:${PORT}/health" || echo "000")

if [ "$response" = "200" ]; then
  echo "✓ Flowrex server is healthy"
  exit 0
else
  echo "✗ Flowrex server is unhealthy (HTTP $response)"
  exit 1
fi

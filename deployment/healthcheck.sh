#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Flowrex Health Check Script
# ═══════════════════════════════════════════════════════════════
# Checks if backend and frontend services are responsive

set -e

# Configuration
BACKEND_URL=${1:-http://localhost:4000}
FRONTEND_URL=${2:-http://localhost:8080}
TIMEOUT=5

echo "═══════════════════════════════════════════════════"
echo "Flowrex Health Check"
echo "═══════════════════════════════════════════════════"

# Check backend
echo ""
echo "Checking backend: $BACKEND_URL/health"
backend_status=$(curl -f -s -o /dev/null -w "%{http_code}" \
  --max-time $TIMEOUT \
  "$BACKEND_URL/health" || echo "000")

if [ "$backend_status" = "200" ]; then
  echo "✓ Backend OK (HTTP $backend_status)"
  backend_ok=true
else
  echo "✗ Backend FAILED (HTTP $backend_status)"
  backend_ok=false
fi

# Check frontend
echo ""
echo "Checking frontend: $FRONTEND_URL/health"
frontend_status=$(curl -f -s -o /dev/null -w "%{http_code}" \
  --max-time $TIMEOUT \
  "$FRONTEND_URL/health" || echo "000")

if [ "$frontend_status" = "200" ]; then
  echo "✓ Frontend OK (HTTP $frontend_status)"
  frontend_ok=true
else
  echo "✗ Frontend FAILED (HTTP $frontend_status)"
  frontend_ok=false
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
  echo "✓ All services healthy"
  exit 0
else
  echo "✗ Some services unhealthy"
  exit 1
fi

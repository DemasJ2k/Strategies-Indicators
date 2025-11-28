# ═══════════════════════════════════════════════════════════════
# Flowrex Production Dockerfile
# ═══════════════════════════════════════════════════════════════
# Multi-stage build for optimized production deployment
# Builds both frontend and backend in a single image

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY src/ ./src/

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine

# Install production dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy database schema
COPY db/ ./db/

# Create healthcheck script
COPY deployment/healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /app/healthcheck.sh

# Set production environment
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/server.js"]

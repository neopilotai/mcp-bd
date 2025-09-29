# Multi-stage build for Node.js worker
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/db/package.json ./packages/db/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the worker
RUN npm run build --filter=@mcp-bd/worker

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy built application
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/packages/db ./packages/db
COPY --from=deps --chown=worker:nodejs /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown worker:nodejs logs

USER worker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001 3002

CMD ["node", "dist/index.js"]
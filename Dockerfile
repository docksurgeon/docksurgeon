FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci && \
    find /app/node_modules/next-auth /app/node_modules/@auth/core -name "*.js" 2>/dev/null | xargs sed -i \
      -e 's|from "next/server"|from "next/server.js"|g' \
      -e 's|from "next/headers"|from "next/headers.js"|g' \
      -e 's|from "next/navigation"|from "next/navigation.js"|g' \
      -e 's|from "next/cache"|from "next/cache.js"|g'

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache procps shadow util-linux

# Create nodejs group + nextjs user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Add nextjs to docker group (match host GID 999)
RUN addgroup -g 999 docker 2>/dev/null || true
RUN addgroup nextjs docker 2>/dev/null || true

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy entrypoint script for smart port detection
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]

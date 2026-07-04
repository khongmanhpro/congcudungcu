# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables (placeholder for build)
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/congcudungcu"
ENV DIRECT_URL="postgresql://postgres:postgres@postgres:5432/congcudungcu"
ENV NODE_ENV=production

# Generate Prisma client
RUN pnpm db:generate

# Build Next.js app
RUN pnpm build

# ============================================================
# Stage 3: Runner
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

FROM node:22-slim AS builder
LABEL build="1773728867"
ARG CACHE_BUST=1773678481

WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files AND patches (required by pnpm patchedDependencies)
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source
ARG CACHEBUST=1773729299
COPY . .

# Build frontend and backend
RUN pnpm build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV NODE_ENV=production

LABEL build=1773730130
CMD ["node", "dist/index.js"]

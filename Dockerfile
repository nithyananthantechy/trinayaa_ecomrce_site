FROM node:22-bookworm-slim
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches

# Install dependencies with frozen lockfile
RUN CI=1 pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Vite client and bundle Express server with esbuild
RUN pnpm build

# Ensure data and uploads directories exist
RUN mkdir -p /app/data /app/client/public/uploads

# Declare persistent volumes for database and media
VOLUME ["/app/data", "/app/client/public/uploads"]

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]

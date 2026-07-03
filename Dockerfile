# syntax=docker/dockerfile:1
# Builds the whole app into one self-contained image. `docker compose up`
# (or install.sh) is the intended way to run it.

FROM node:22-alpine AS builder
RUN npm i -g pnpm@10.28.2
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Placeholders so generate/build never trip on missing env; real values are
# runtime-only (nothing server-side is baked into the bundle).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV BETTER_AUTH_SECRET="build-time-placeholder"
RUN pnpm --filter @repo/database generate

# Baked into the client bundle at build time; pass a different URL when
# hosting somewhere other than http://localhost:3000.
ARG NEXT_PUBLIC_SAAS_URL=http://localhost:3000
ENV NEXT_PUBLIC_SAAS_URL=$NEXT_PUBLIC_SAAS_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# A minimal Prisma workspace so the container can sync the schema on boot
# (plain `db push`: additive changes apply, destructive ones refuse and need
# a human - never --accept-data-loss here).
COPY packages/database/prisma.config.ts /app/db/
COPY packages/database/prisma/schema.prisma /app/db/prisma/
RUN cd /app/db && npm install --no-save prisma@7.6.0 dotenv

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /data && chown -R node:node /data /app/apps/web/.next

USER node
EXPOSE 3000
ENV HOSTNAME=0.0.0.0 PORT=3000 STORAGE_VOLUME_PATH=/data
ENTRYPOINT ["/entrypoint.sh"]

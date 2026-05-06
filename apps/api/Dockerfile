FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @hang/shared build
RUN pnpm --filter @hang/api build
RUN pnpm --filter @hang/api prisma generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "-c", "node -e \"require('./dist/lib/prisma.js')\" && node dist/server.js"]

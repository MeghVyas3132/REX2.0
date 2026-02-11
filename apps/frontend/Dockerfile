FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS installer
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json .npmrc* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY packages/llm/package.json ./packages/llm/
COPY packages/engine/package.json ./packages/engine/
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile || pnpm install

FROM installer AS builder
COPY packages ./packages
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @rex/types build
RUN pnpm --filter @rex/frontend build

EXPOSE 3000
CMD ["pnpm", "--filter", "@rex/frontend", "start"]

# syntax=docker/dockerfile:1

# ---------- Bauen: Tests laufen lassen, Spiel bauen (einmal, egal für welche Zielplattform) ----------
FROM --platform=$BUILDPLATFORM node:24-slim AS bauen
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/spiel/package.json packages/spiel/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --no-audit --no-fund
COPY packages packages
COPY apps apps
RUN npm test && npm run typecheck && npm run build

# ---------- Laufen: nur der Server und das gebaute Spiel ----------
FROM node:24-slim
ARG LICHTUNG_VERSION=dev
ENV NODE_ENV=production \
    PORT=8080 \
    LICHTUNG_VERSION=$LICHTUNG_VERSION
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/spiel/package.json packages/spiel/
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
RUN npm ci --omit=dev --workspace=@lichtung/server --no-audit --no-fund && npm cache clean --force
COPY apps/server/src apps/server/src
COPY --from=bauen /app/apps/web/dist apps/web/dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/api/gesund').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "apps/server/src/server.ts"]

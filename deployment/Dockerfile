# Temporary test hosting only. No deployment is triggered by this file.
FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build
WORKDIR /app/apps/studio
ENV NEXT_TELEMETRY_DISABLED=1 BELEM_DATA_DIR=/tmp/belem-build
COPY apps/studio/package.json apps/studio/package-lock.json ./
RUN --mount=type=secret,id=network_ca \
    if [ -f /run/secrets/network_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/network_ca; fi; \
    npm ci --no-audit --no-fund
COPY apps/studio ./
COPY index.html /app/index.html
COPY .github/scripts/gallery-smoke.mjs /app/.github/scripts/gallery-smoke.mjs
RUN npm run build

FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 BELEM_DATA_DIR=/var/lib/belem BELEM_REPOSITORY_DIR=/app PORT=3000
WORKDIR /app/apps/studio
COPY --from=build --chown=node:node /app/apps/studio/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/studio/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/studio/.next ./.next
COPY --from=build --chown=node:node /app/apps/studio/lib ./lib
COPY --from=build --chown=node:node /app/apps/studio/scripts ./scripts
COPY --from=build --chown=node:node /app/apps/studio/next.config.ts ./next.config.ts
COPY --chown=node:node index.html /app/index.html
COPY --chown=node:node .github/scripts/gallery-smoke.mjs /app/.github/scripts/gallery-smoke.mjs
COPY --chown=node:node A_Bencao_Belem_Site.mp3 Trilha_Estrela_de_Belem_site.mp3 /app/
COPY --chown=node:node deployment/start-preview.sh /app/start-preview.sh
RUN mkdir -p /var/lib/belem && chown node:node /var/lib/belem && chmod 700 /var/lib/belem && chmod 700 /app/start-preview.sh
USER node
EXPOSE 3000
ENTRYPOINT ["/app/start-preview.sh"]

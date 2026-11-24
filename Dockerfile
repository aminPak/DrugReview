# Container for the DrugReview API (apps/api), for Google Cloud Run.
# Build from the repository root:  docker build -t drugreview-api .
# The website (Vercel) and mobile app (Expo EAS) are deployed separately.

# ---- Build: install the API's dependencies and bundle it into one file ----
FROM node:22-slim AS build
WORKDIR /repo

# Corepack can't run pnpm 12 yet, so install it with npm.
RUN npm install -g pnpm@12.21.0

# Copy the workspace (see .dockerignore for what's left out) and install only what the API needs.
COPY . .
RUN pnpm install --frozen-lockfile --filter "@drugreview/api..."
RUN pnpm --filter @drugreview/api build

# ---- Run: just Node and the bundle ----
FROM node:22-slim
WORKDIR /app
# Cloud Run's disk is temporary: admin settings saved in DATA_DIR are lost on restart.
# Set the AI key as a secret (ANTHROPIC_API_KEY) instead. See docs/hosting-setup-cheat-sheet.pdf.
ENV NODE_ENV=production PORT=8080 DATA_DIR=/tmp/drugreview-data
COPY --from=build /repo/apps/api/dist ./dist
# Only its "type": "module" is used: it tells Node the bundle is an ES module.
COPY --from=build /repo/apps/api/package.json ./package.json
USER node
EXPOSE 8080
CMD ["node", "--enable-source-maps", "dist/index.js"]

# Build stage
FROM node:22.20.0-alpine AS build

# Install dependencies for gyp to work
RUN --mount=type=cache,target=/var/cache/apk,sharing=locked apk add --update build-base git python3 py3-setuptools

WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --prefer-offline --no-audit

# Bootstrap the project
RUN --mount=type=cache,target=/root/.npm npm run bootstrap -- --scope=monograph

# Build the application
RUN --mount=type=cache,target=/root/.npm npm run tx @notesnook/monograph:build

# Production stage
FROM oven/bun:1.2.21-slim AS production

# Copy built files from build stage
WORKDIR /home/bun/app
COPY --chown=bun:bun --from=build /app/apps/monograph/output .

# Set the user to bun
RUN chown -R bun:bun /home/bun/app
USER bun

# Install server dependencies
RUN bun install

CMD [ "bun", "run", "start" ]

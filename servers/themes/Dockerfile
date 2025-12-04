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
RUN --mount=type=cache,target=/root/.npm npm run bootstrap -- --scope=themes

# Build the server
RUN npm run build:server:themes

# Production stage
FROM node:22.20.0-alpine AS production

# Install git to pull the themes repo
RUN --mount=type=cache,target=/var/cache/apk,sharing=locked apk add --update git

WORKDIR /app

# Copy server files from previous stage
COPY --from=build /app/servers/themes/dist ./dist

# Set default values for environment variables
ENV THEMES_REPO_URL="https://github.com/streetwriters/notesnook-themes.git"

CMD ["node", "dist/server.mjs"]

# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

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
RUN --mount=type=cache,target=/root/.npm npm run bootstrap -- --scope=web

# Set dummy values before build for later injection
ENV PUBLIC_URL="INJECT_ENV__PUBLIC_URL" \
  NN_API_HOST="INJECT_ENV__API_HOST" \
  NN_AUTH_HOST="INJECT_ENV__AUTH_HOST" \
  NN_SSE_HOST="INJECT_ENV__SSE_HOST" \
  NN_ISSUES_HOST="INJECT_ENV__ISSUES_HOST" \
  NN_SUBSCRIPTIONS_HOST="INJECT_ENV__SUBSCRIPTIONS_HOST" \
  NN_MONOGRAPH_HOST="INJECT_ENV__MONOGRAPH_HOST" \
  NN_NOTESNOOK_HOST="INJECT_ENV__NOTESNOOK_HOST" \
  NN_THEME_SERVER_URL="INJECT_ENV__THEME_SERVER_URL"

# Build the application
RUN npm run build:web

# Production stage
FROM nginx:alpine AS production

# Copy built files from build stage to nginx
COPY --from=build /app/apps/web/build /usr/share/nginx/html

# Set default values for environment variables
ENV PUBLIC_URL="https://app.notesnook.com" \
  API_HOST="https://api.notesnook.com" \
  AUTH_HOST="https://auth.streetwriters.co" \
  SSE_HOST="https://events.streetwriters.co" \
  ISSUES_HOST="https://issues.streetwriters.co" \
  SUBSCRIPTIONS_HOST="https://subscriptions.streetwriters.co" \
  MONOGRAPH_HOST="https://monogr.ph" \
  NOTESNOOK_HOST="https://notesnook.com" \
  THEME_SERVER_URL="https://themes-api.notesnook.com"

# Copy environment injection script
COPY scripts/inject-env.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Configure nginx for SPA
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Enable gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  gzip_comp_level 6;
  gzip_min_length 1000;

  # Cache static assets
  location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000";
  }

  # SPA routing - redirect all non-file requests to index.html
  location / {
    try_files \$uri \$uri.html /index.html;
  }
}
EOF

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: build
FROM node:22-alpine AS builder

# Build-time env var — passed via --build-arg VITE_API_URL=...
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Stage 2: serve
FROM nginx:stable-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built output from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA — route all requests to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

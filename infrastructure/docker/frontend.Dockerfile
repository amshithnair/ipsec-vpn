# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
RUN npm install

COPY apps/frontend/ .
RUN npm run build

# ── Serve stage ──
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm install

COPY apps/frontend/ .
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# WMSS Frontend — Multi-stage Build
# Stage 1: Build (Node + Vite)
# Stage 2: Serve (Nginx)
# ============================================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first → tận dụng Docker cache layer
COPY package.json package-lock.json* ./
RUN npm ci

# Copy toàn bộ source code
COPY . .

# Build production bundle
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine

# Copy file build ra từ Vite vào Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx cho SPA (mọi route đều trả về index.html)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build React App (Vite bakes VITE_* at build time)
FROM node:18-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000/ws/telemetry
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Update Nginx conf to handle React Router fallsbacks if needed (optional for simple demos but good practice)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

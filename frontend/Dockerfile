# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder - Build de la aplicación React
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files primero para mejor caching
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar todo el código
COPY . .

# Build de producción
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production - Servir con Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copiar build output del builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
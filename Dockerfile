# Build multi-etapa del frontend Angular (SPA estática servida por nginx)
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# El conf de nginx lo monta docker-compose (infra/nginx/frontend.conf)
COPY --from=build /app/dist/sigma-pro-frontend/browser /usr/share/nginx/html
EXPOSE 80

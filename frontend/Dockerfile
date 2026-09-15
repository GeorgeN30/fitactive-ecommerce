FROM node:20-slim AS build

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BAAS_WS_URL
ARG VITE_JWT_APP_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BAAS_WS_URL=$VITE_BAAS_WS_URL
ENV VITE_JWT_APP_ID=$VITE_JWT_APP_ID

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile

COPY frontend .

RUN pnpm build

FROM nginx:stable-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

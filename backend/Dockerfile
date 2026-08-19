FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile

COPY backend .

RUN npx prisma generate

RUN pnpm build

EXPOSE 4000

COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]

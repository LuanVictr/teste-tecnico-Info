# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --prefer-offline || npm install

COPY . .
RUN npm run build && npm prune --omit=dev

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/main"]

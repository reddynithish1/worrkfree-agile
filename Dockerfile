# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Ensure required environment variables
ENV NODE_ENV=production

# Copy dependencies and bundled server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Make sure there is a db directory for users.json persistence
RUN mkdir -p /app/src/db

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

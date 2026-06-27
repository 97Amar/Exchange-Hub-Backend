FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

COPY shared/ ./shared/

COPY backend/notification-service/package*.json ./backend/notification-service/

RUN npm install

COPY . .

RUN cd backend/notification-service && npm run build

# 2. Runner stage (Final Image)
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/backend/notification-service/dist ./dist
COPY --from=builder /app/backend/notification-service/package*.json ./
COPY --from=builder /app/backend/notification-service/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
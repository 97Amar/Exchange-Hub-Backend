# Base stage
FROM node:20-alpine AS builder
WORKDIR /app

# Sabse pehle root ki dependency copies taaki caching achi rahe
COPY package*.json ./
COPY shared ./shared

# Specific service ki dependency copy
COPY backend/user-service/package*.json ./backend/user-service/
RUN npm install

# Ab saara code copy karein
COPY . .

# Service build karein
RUN cd backend/user-service && npm run build

# Runner stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/user-service/dist ./dist
COPY --from=builder /app/backend/user-service/package*.json ./
RUN npm install --production

EXPOSE 3000
CMD ["node", "dist/main.js"]
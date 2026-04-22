FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY ../../package*.json /tmp/root/
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]

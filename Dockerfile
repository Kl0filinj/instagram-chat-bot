FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY package*.json ./

RUN npm install --legacy-peer-deps

USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
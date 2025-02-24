FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY .env .
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate
USER node
CMD ["node", "dist/src/main.js"]
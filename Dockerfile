# Builder stage
FROM node:18 as builder

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm install

# Copy all source files and build the application
COPY . .
RUN npm run build

# Final stage
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm install && npx prisma generate

# Copy the built application
COPY --from=builder /app/dist ./dist

# Expose the port NestJS typically uses
EXPOSE 3000

# Command to run the application
# CMD ["node", "dist/src/main.js"]
CMD [  "npm", "run", "start:migrate:prod" ]
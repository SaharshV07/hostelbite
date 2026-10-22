FROM node:22-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies for both server and client
RUN npm run install:all

# Copy all source files
COPY . .

# Build React client bundle
RUN npm run build --prefix client

# Expose default HTTP port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start unified server (auto-seeds SQLite database if empty)
CMD ["npm", "start", "--prefix", "server"]

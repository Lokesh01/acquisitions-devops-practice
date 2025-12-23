# Multi-stage Dockerfile for Node.js acquisitions application

FROM node:18-alpine AS base

#set working directory
WORKDIR /app

#copy package files
COPY package*.json ./

#install dependencies
RUN npm ci --only=production && npm cache clean --force

#copy source code
COPY . .

#create non-root user for security
# - __`addgroup -g 1001 -S nodejs`__: Creates a system group named `nodejs` with GID 1001

# - `-S`: Creates a system group (no password, lower privilege)
# - `-g 1001`: Sets specific group ID for consistency across environments

# - __`adduser -S nodejs -u 1001`__: Creates a system user named `nodejs` with UID 1001

# - `-S`: Creates a system user (non-login, minimal privileges)
# - `-u 1001`: Sets specific user ID matching the group
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

#change ownership of app directory
# - __`chown -R`__: Recursively changes ownership of all files in `/app`
# - __`nodejs:nodejs`__: Sets both user and group to `nodejs`
# - __Why?__ The files were copied as root; the nodejs user needs permission to read/write them
RUN chown -R nodejs:nodejs /app

#switch to non-root user
USER nodejs

#expose port
EXPOSE 3000

#Heath check
# - Makes HTTP GET request to `http://localhost:3000/health`
# - Exits with code 0 (healthy) if status is 200
# - Exits with code 1 (unhealthy) on any error or non-200 status
# - __Benefits__: Container orchestrators (Docker, Kubernetes) use this to restart unhealthy containers
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

#dev stage
FROM base AS development
USER root
RUN npm ci && npm cache clean --force
USER nodejs
CMD [ "npm", "run", "dev" ]

#prod stage
FROM base AS production
CMD [ "npm", "start" ]
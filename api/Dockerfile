FROM node:18-alpine
WORKDIR /opt/app

COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci

COPY . .
RUN npm run build
CMD ["node", "dist/bin/server.js"]